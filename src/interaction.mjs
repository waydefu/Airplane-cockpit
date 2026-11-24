// SPDX-License-Identifier: GPL-2.0-only
import * as THREE from "three";
import {CONTROL_LABELS} from "./sim.mjs";
export const displayKind={"pfd1.screen":"PFD","pfd2.screen":"PFD","ND.screen":"ND","ND_R.screen":"ND",
"uecam.screen":"EWD","lecam.screen":"ECAM","mcdu1.screen":"MCDU","mcdu2.screen":"MCDU"};
export function getName(o){
  let p=o;
  while(p){
    if(typeof p.userData?.sourceName==="string"&&p.userData.sourceName)return p.userData.sourceName;
    if(CONTROL_LABELS[p.name]||displayKind[p.name])return p.name;
    p=p.parent;
  }
  return o.name||"未命名部件";
}
// FlightGear GLB retains subparts such as BatteryBtn11F and APUStartBtn2O.
// Resolve those to their parent controller without copying third-party application code.
const keysByLength=Object.keys(CONTROL_LABELS).sort((a,b)=>b.length-a.length);
export function findControl(raw){
  if(CONTROL_LABELS[raw])return raw;
  for(const name of keysByLength){
    const suffix=raw.slice(name.length);
    if(raw.startsWith(name)&&suffix&&/^[A-Za-z0-9]{1,3}$/.test(suffix))return name;
  }
  return null;
}
export function addHitTargets(model,parts){
  if(!Array.isArray(parts))throw new Error("模型控制器清單無效");
  const material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false});
  for(const id of keysByLength){
    const entry=parts.find(part=>part.name===id);
    if(!entry||!Array.isArray(entry.min)||!Array.isArray(entry.max))continue;
    const center=entry.min.map((v,i)=>(v+entry.max[i])/2);
    const size=entry.min.map((v,i)=>Math.max(entry.max[i]-v,0.004));
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);
    mesh.position.set(...center);
    mesh.name="hitbox:"+id;mesh.userData.sourceName=id;
    model.add(mesh);
  }
}
