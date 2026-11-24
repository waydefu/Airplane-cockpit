// SPDX-License-Identifier: GPL-2.0-only
import * as THREE from "three";
import {hasAc} from "./sim.mjs";
export function makeDisplay(kind){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=512;
  const texture=new THREE.CanvasTexture(canvas);
  texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;
  return {kind,canvas,texture};
}
export function drawDisplay(display,state){
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
    text("---",16,238,32,"#ffffff");text("-----",402,238,26,"#ffffff");
    text("HDG ---",185,346,27);
    text("A320 / PROTOTYPE",86,433,19,"#e9c48a");
    text("NOT FOR FLIGHT",147,477,15,"#df988c");
  }else if(kind==="ND"){
    text("ND / DEMONSTRATION",32,54,22);
    c.strokeStyle="#82cba9";
    for(const r of [65,120,180]){c.beginPath();c.arc(256,303,r,Math.PI*1.12,Math.PI*1.88);c.stroke();}
    c.beginPath();c.moveTo(256,303);c.lineTo(256,148);c.stroke();
    text("HDG ---",166,466,24);
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
