// SPDX-License-Identifier: GPL-2.0-only
import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {views} from "./views.mjs";
import {displayKind,getName,findControl,addHitTargets} from "./interaction.mjs";
import {makeDisplay,drawDisplay} from "./displays.mjs";
export function createViewer({canvas,getState,act,notify,loadState,onFrame,getView}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.setClearColor(0x091820);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,matchMedia("(max-width:760px)").matches?1.35:1.8));
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x091820);
  scene.add(new THREE.HemisphereLight(0xb2d3e5,0x151e26,2.7));
  const a=new THREE.DirectionalLight(0xffe8c5,2.9);a.position.set(1,2,2);scene.add(a);
  const b=new THREE.DirectionalLight(0x73c1c5,1.3);b.position.set(-2,1,-1);scene.add(b);
  const camera=new THREE.PerspectiveCamera(76,1,.015,150);
  const orbit=new OrbitControls(camera,canvas);
  orbit.enableDamping=true;orbit.dampingFactor=.08;orbit.screenSpacePanning=true;
  orbit.minDistance=.08;orbit.maxDistance=10;
  const setView=id=>{
    const v=views[id]||views.captain;
    camera.position.set(...v.p);orbit.target.set(...v.t);
    camera.fov=v.f;camera.updateProjectionMatrix();orbit.update();
  };
  setView("captain");
  const resize=()=>{
    const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;
  };
  window.addEventListener("resize",resize);
  const raycaster=new THREE.Raycaster(),pos=new THREE.Vector2();
  let model=null,displays=[],disposed=false,raf=0,contextLost=false,dirty=true,activePointers=new Set(),gesture=false;
  const invalidate=()=>{dirty=true;};
  resize();
  let down=null;
  const pointerDown=e=>{
    activePointers.add(e.pointerId);
    if(activePointers.size!==1){gesture=true;down=null;return;}
    gesture=false;down={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()};
  };
  const pointerCancel=e=>{activePointers.delete(e.pointerId);down=null;gesture=true;};
  const pointerUp=e=>{
    activePointers.delete(e.pointerId);
    if(gesture||!down||down.id!==e.pointerId||!model){down=null;return;}
    const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.time;down=null;
    if(moved>7||dt>550||e.button!==0)return;
    const box=canvas.getBoundingClientRect();
    pos.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);
    raycaster.setFromCamera(pos,camera);
    const hits=raycaster.intersectObject(model,true);
    if(!hits.length)return;
    let selected=null,raw="";
    const nearest=hits[0].distance;
    for(const hit of hits){
      if(hit.distance-nearest>0.012)break;
      raw=getName(hit.object);
      const found=findControl(raw);
      if(found){selected=found;break;}
    }
    if(selected)act(selected,e.shiftKey?-1:1);
    else notify(raw+" · 此部件僅供檢視（尚未接入控制功能）");
  };
  canvas.addEventListener("pointerdown",pointerDown);
  canvas.addEventListener("pointerup",pointerUp);
  canvas.addEventListener("pointercancel",pointerCancel);
  canvas.addEventListener("lostpointercapture",pointerCancel);
  const lost=e=>{e.preventDefault();contextLost=true;loadState("error","GPU 渲染中斷，請等待恢復或重新載入");};
  const restored=()=>{contextLost=false;dirty=true;if(model){updateDisplays();loadState("ready","A320 駕駛艙已恢復");}};
  canvas.addEventListener("webglcontextlost",lost);
  canvas.addEventListener("webglcontextrestored",restored);
  orbit.addEventListener("change",invalidate);
  let lastReport=0;
  function report(){const info=renderer.info;onFrame({drawCalls:info.render.calls,triangles:info.render.triangles,textures:info.memory.textures,geometries:info.memory.geometries});}
  function loop(now){
    if(disposed)return;
    raf=requestAnimationFrame(loop);
    if(document.hidden||contextLost)return;
    orbit.update();
    if(!dirty)return;
    dirty=false;renderer.render(scene,camera);
    if(now-lastReport>=500){report();lastReport=now;}
  }
  raf=requestAnimationFrame(loop);
  const updateDisplays=()=>{displays.forEach(d=>drawDisplay(d,getState()));invalidate();};
  async function load(){
    const loader=new GLTFLoader();
    const base=new URL("./public/assets/a320/",document.baseURI);
    const signal=AbortSignal.timeout(120000);
    const manifestResponse=await fetch(new URL("cockpit-manifest.json",base),{signal});
    if(!manifestResponse.ok)throw new Error("控制器清單 HTTP "+manifestResponse.status);
    const manifest=await manifestResponse.json();
    if(!Array.isArray(manifest.parts)||!manifest.parts.length)throw new Error("控制器清單缺失");
    const response=await fetch(new URL("cockpit.glb",base),{signal});
    if(!response.ok)throw new Error("駕駛艙模型 HTTP "+response.status);
    loadState("loading","正在下載並解析本機 A320 模型（約 50.6 MB）…");
    const data=await response.arrayBuffer();
    if(data.byteLength!==50576144)throw new Error("模型大小與已審核版本不符");
    const gltf=await loader.parseAsync(data,base.href);
    model=gltf.scene;
    model.traverse(o=>{
      if(!o.isMesh)return;
      const kind=displayKind[getName(o)];
      if(kind){
        const display=makeDisplay(kind);
        displays.push(display);
        o.material=new THREE.MeshBasicMaterial({map:display.texture,toneMapped:false,side:THREE.DoubleSide});
      }else if(o.material?.map){
        o.material.map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
      }
    });
    addHitTargets(model,manifest.parts);
    scene.add(model);setView(getView());updateDisplays();
    renderer.render(scene,camera);report();
    loadState("ready","A320 駕駛艙載入完成 · 可點擊控制器，或開啟控制面板操作");
  }
  function dispose(){
    disposed=true;cancelAnimationFrame(raf);
    window.removeEventListener("resize",resize);
    canvas.removeEventListener("pointerdown",pointerDown);
    canvas.removeEventListener("pointerup",pointerUp);
    canvas.removeEventListener("pointercancel",pointerCancel);
    canvas.removeEventListener("lostpointercapture",pointerCancel);
    canvas.removeEventListener("webglcontextlost",lost);
    canvas.removeEventListener("webglcontextrestored",restored);
    orbit.dispose();
    const geometries=new Set(),materials=new Set(),textures=new Set();
    scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material||[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
    renderer.dispose();
  }
  return {load,setView,updateDisplays,dispose};
}
