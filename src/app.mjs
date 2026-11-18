// SPDX-License-Identifier: GPL-2.0-only
// Independently authored viewer. Aviation displays are demonstrators, not real instruments.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { initialState, operate, adjustFcu, advance, readouts, hasAc, CONTROL_LABELS } from "./sim.mjs";
const qs=id=>document.getElementById(id);
let state=initialState(),viewer=null,started=false;
const upstreamCommit="b2afd173081aea5db00031baa1003aa7c46a789a";
const models=["./public/assets/a320/cockpit.glb","https://raw.githubusercontent.com/radebit/flight-simulator/"+upstreamCommit+"/public/models/a320/cockpit.glb"];
function status(message,error=false){let el=qs("loadStatus");el.textContent=message;el.classList.toggle("error",error);}
function refresh(){
  const r=readouts(state);
  const data={
    powerReadout:r.power,extReadout:r.external,apuReadout:r.apu,irsReadout:r.ir,
    bat1Readout:r.batteries[0],bat2Readout:r.batteries[1],
    extButtonReadout:state.externalPower?"ON":"OFF",apuMasterReadout:state.apuMaster?"ON":"OFF",
    apuStartReadout:r.apu,apuGenReadout:state.apuGenerator?"ON":"OFF",
    speedReadout:r.speed,headingReadout:r.heading,altitudeReadout:r.altitude
  };
  for(const [id,text] of Object.entries(data))qs(id).textContent=text;
  if(viewer)viewer.updateDisplays();
}
function act(name,dir=1){
  const feedback=operate(state,name,dir);
  qs("targetInfo").textContent=(CONTROL_LABELS[name]||name)+" · "+feedback;
  status(feedback);refresh();
}
function openManual(){qs("manualModal").hidden=false;qs("enterButton").focus();}
function closeManual(){
  qs("manualModal").hidden=true;
  if(!started){started=true;status("正在初始化 3D 引擎…");begin();}
  else qs("manualButton").focus();
}
qs("manualButton").addEventListener("click",openManual);
qs("enterButton").addEventListener("click",closeManual);
qs("aboutButton").addEventListener("click",()=>{qs("aboutModal").hidden=false;qs("closeAbout").focus();});
qs("closeAbout").addEventListener("click",()=>{qs("aboutModal").hidden=true;qs("aboutButton").focus();});
qs("sideToggle").addEventListener("click",()=>{
  let hidden=qs("sidePanel").classList.toggle("is-hidden");
  qs("sideToggle").setAttribute("aria-expanded",String(!hidden));
});
qs("resetButton").addEventListener("click",()=>{
  state=initialState();status("Cold & Dark 已重設");refresh();
});
document.querySelectorAll("[data-control]").forEach(b=>b.addEventListener("click",()=>act(b.dataset.control)));
document.querySelectorAll("[data-adjust]").forEach(b=>b.addEventListener("click",()=>{
  const message=adjustFcu(state,b.dataset.adjust,Number(b.dataset.delta));
  status(message);state.last=message;refresh();
}));
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("[data-view]").forEach(el=>el.classList.toggle("is-current",el===b));
  if(viewer)viewer.setView(b.dataset.view);
}));
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!qs("aboutModal").hidden)qs("closeAbout").click();
});
const views={
captain:{p:[.24,.62,.52],t:[-.55,.30,.35],f:76},
main:{p:[.35,.38,.02],t:[-.53,.22,0],f:74},
overhead:{p:[.82,.10,0],t:[.35,1.07,0],f:76},
pedestal:{p:[.36,.51,.11],t:[-.14,-.10,0],f:64},
mcdu:{p:[-.08,.30,.185],t:[-.36,-.071,.185],f:42},
overview:{p:[.91,.64,.06],t:[-.3,.44,0],f:86}
};
const displayKind={"pfd1.screen":"PFD","pfd2.screen":"PFD","ND.screen":"ND","ND_R.screen":"ND",
"uecam.screen":"EWD","lecam.screen":"ECAM","mcdu1.screen":"MCDU","mcdu2.screen":"MCDU"};
function getName(o){
  let p=o;
  while(p){
    if(typeof p.userData?.sourceName==="string"&&p.userData.sourceName)return p.userData.sourceName;
    if(CONTROL_LABELS[p.name]||displayKind[p.name])return p.name;
    p=p.parent;
  }
  return o.name||"未命名部件";
}
function makeDisplay(kind){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=512;
  const texture=new THREE.CanvasTexture(canvas);
  texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;
  return {kind,canvas,texture};
}
function drawDisplay(display){
  const {kind,canvas,texture}=display,c=canvas.getContext("2d");
  if(!c)return;
  c.fillStyle="#020708";c.fillRect(0,0,512,512);
  if(!hasAc(state)){texture.needsUpdate=true;return;}
  const text=(value,x,y,size=21,color="#98e8bf")=>{
    c.font=size+"px monospace";c.fillStyle=color;c.fillText(value,x,y);
  };
  c.strokeStyle="#436d72";c.lineWidth=2;c.strokeRect(8,8,496,496);
  if(kind==="PFD"){
    text("SPD",22,49,20);text("ALT",395,49,20);
    c.fillStyle="#365e86";c.fillRect(110,73,288,136);
    c.fillStyle="#81513c";c.fillRect(110,209,288,80);
    c.strokeStyle="#f1e4bd";c.lineWidth=4;c.beginPath();c.moveTo(125,209);c.lineTo(380,209);c.stroke();
    text("250",16,238,32,"#ffffff");text("01000",402,238,26,"#ffffff");
    text("HDG "+String(state.heading).padStart(3,"0"),185,346,27);
    text("A320 / PROTOTYPE",86,433,19,"#e9c48a");
    text("NOT FOR FLIGHT",147,477,15,"#df988c");
  }else if(kind==="ND"){
    text("ND / DEMONSTRATION",32,54,22);
    c.strokeStyle="#82cba9";
    for(const r of [65,120,180]){c.beginPath();c.arc(256,303,r,Math.PI*1.12,Math.PI*1.88);c.stroke();}
    c.beginPath();c.moveTo(256,303);c.lineTo(256,148);c.stroke();
    text("HDG "+String(state.heading).padStart(3,"0"),166,466,24);
  }else if(kind==="EWD"){
    text("ENGINE / WARN (DEMO)",36,58,21);
    text("ENG 1      ENG 2",44,134,26);
    text("OFF        OFF",44,189,22,"#e4bc80");
    text("APU "+(state.apuAvailable?"AVAIL":state.apuStarting?"START":"OFF"),44,277,27);
    text("NOT AN AIRCRAFT SYSTEM",34,470,16,"#df988c");
  }else if(kind==="ECAM"){
    text("ELEC / STATUS",60,59,29);
    text("BAT 1 "+(state.batteries[0]?"AUTO":"OFF"),46,137,22);
    text("BAT 2 "+(state.batteries[1]?"AUTO":"OFF"),46,185,22);
    text("EXT PWR "+(state.externalPower?"ON":"OFF"),46,233,22);
    text("APU GEN "+(state.apuGenerator?"ON":"OFF"),46,281,22);
    text("SIMPLIFIED",55,451,20,"#e4bc80");
  }else{
    text("MCDU",220,75,31,"#f6edc7");
    text("INIT       1/1",55,143,25);
    text("COCKPIT DEMONSTRATOR",39,215,19);
    text("F-PLN UNAVAILABLE",39,286,22,"#df988c");
    text("SEE USER MANUAL",39,371,21);
  }
  texture.needsUpdate=true;
}
function createViewer(){
  const canvas=qs("world");
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
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  };
  resize();window.addEventListener("resize",resize);
  const raycaster=new THREE.Raycaster(),pos=new THREE.Vector2();
  let model=null,displays=[];
  let down=null;
  canvas.addEventListener("pointerdown",e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};});
  canvas.addEventListener("pointercancel",()=>down=null);
  canvas.addEventListener("pointerup",e=>{
    if(!down||!model)return;
    const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.time;down=null;
    if(moved>7||dt>550||e.button!==0)return;
    const box=canvas.getBoundingClientRect();
    pos.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);
    raycaster.setFromCamera(pos,camera);
    const hits=raycaster.intersectObject(model,true);
    if(!hits.length)return;
    let selected=null,raw="";
    for(const hit of hits){
      raw=getName(hit.object);
      if(CONTROL_LABELS[raw]){selected=raw;break;}
    }
    if(selected)act(selected,e.shiftKey?-1:1);
    else qs("targetInfo").textContent=raw+" · 此部件僅供檢視（尚未接入控制功能）";
  });
  function loop(){
    requestAnimationFrame(loop);
    if(document.hidden)return;
    orbit.update();renderer.render(scene,camera);
  }
  requestAnimationFrame(loop);
  const updateDisplays=()=>displays.forEach(drawDisplay);
  async function load(){
    const loader=new GLTFLoader();
    async function download(url){
      return await new Promise((resolve,reject)=>{
        loader.load(url,resolve,event=>{
          const mb=(event.loaded/1048576).toFixed(1);
          status("正在下載駕駛艙："+mb+" MB"+(event.total?" / "+(event.total/1048576).toFixed(1)+" MB":""));
        },reject);
      });
    }
    let gltf;
    try{gltf=await download(models[0]);}
    catch(err){
      status("本機模型尚未就緒，改用上游 GPL-2.0 模型備援…");
      try{gltf=await download(models[1]);}
      catch(remote){console.error("Both model sources failed",err,remote);throw new Error("3D 模型無法下載，請確認網路、來源及 GLB 匯入狀態。");}
    }
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
    scene.add(model);setView("captain");updateDisplays();
    status("A320 駕駛艙載入完成 · 可點擊控制器，或由右側面板操作");
  }
  return {load,setView,updateDisplays};
}
async function begin(){
  try{
    if(!window.WebGLRenderingContext)throw new Error("瀏覽器不支援 WebGL");
    viewer=createViewer();await viewer.load();refresh();
  }catch(e){
    status("無法進入 3D 模式："+e.message,true);
    qs("targetInfo").textContent="仍可使用右側控制面板及繁體中文說明書。";
  }
}
setInterval(()=>{
  if(advance(state,1)){refresh();status(state.last);}
  else if(state.apuStarting)refresh();
},1000);
refresh();
