// SPDX-License-Identifier: GPL-2.0-only
import { initialState, operate, adjustFcu, advance, readouts, hasAc, CONTROL_LABELS } from "./sim.mjs";
const qs=id=>document.getElementById(id);
let state=initialState(),viewer=null,started=false,selectedView="captain";
// Loading is a durable state. UI interactions must never overwrite it.
function loadState(phase,message){
  const el=qs("loadStatus");
  el.dataset.phase=phase;
  el.textContent=message;
  el.classList.toggle("error",phase==="error");
  qs("retryButton").hidden=phase!=="error";
}
function notify(message){qs("targetInfo").textContent=message;}
function setPanelVisible(visible){
  qs("sidePanel").classList.toggle("is-hidden",!visible);
  qs("sideToggle").setAttribute("aria-expanded",String(visible));
  qs("sideToggle").textContent=visible?"收起控制面板":"開啟控制面板";
}
const mobileQuery=matchMedia("(max-width:760px)");
setPanelVisible(!mobileQuery.matches);
mobileQuery.addEventListener("change",e=>setPanelVisible(!e.matches));
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
  notify((CONTROL_LABELS[name]||name)+" · "+feedback);
  refresh();
}
function openManual(){qs("manualModal").hidden=false;qs("simulator").inert=true;qs("enterButton").focus();}
function closeManual(){
  qs("manualModal").hidden=true;qs("simulator").inert=false;
  if(!started){started=true;loadState("loading","正在初始化 3D 引擎…");begin();}
  else qs("manualButton").focus();
}
qs("manualButton").addEventListener("click",openManual);
qs("enterButton").addEventListener("click",closeManual);
qs("aboutButton").addEventListener("click",()=>{qs("aboutModal").hidden=false;qs("simulator").inert=true;qs("closeAbout").focus();});
qs("closeAbout").addEventListener("click",()=>{qs("aboutModal").hidden=true;qs("simulator").inert=false;qs("aboutButton").focus();});
qs("sideToggle").addEventListener("click",()=>{
  setPanelVisible(qs("sidePanel").classList.contains("is-hidden"));
});
qs("resetButton").addEventListener("click",()=>{
  state=initialState();notify("Cold & Dark 已重設");refresh();
});
document.querySelectorAll("[data-control]").forEach(b=>b.addEventListener("click",()=>act(b.dataset.control)));
document.querySelectorAll("[data-adjust]").forEach(b=>b.addEventListener("click",()=>{
  const message=adjustFcu(state,b.dataset.adjust,Number(b.dataset.delta));
  notify("FCU · "+message);state.last=message;refresh();
}));
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("[data-view]").forEach(el=>el.classList.toggle("is-current",el===b));
  selectedView=b.dataset.view;
  if(viewer)viewer.setView(selectedView);
  if(mobileQuery.matches)setPanelVisible(false);
}));
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!qs("aboutModal").hidden)qs("closeAbout").click();
});
let loading=false;
async function begin(){
  if(loading)return;loading=true;
  try{
    loadState("loading","正在初始化 3D 引擎…");
    if(viewer){viewer.dispose();viewer=null;}
    const {createViewer}=await import("./viewer.mjs");
    viewer=createViewer({canvas:qs("world"),getState:()=>state,act,notify,loadState,getView:()=>selectedView,onFrame:stats=>{
      qs("diagnostics").textContent="Draw calls "+stats.drawCalls+" · 三角形 "+stats.triangles+" · 貼圖 "+stats.textures+" · 幾何 "+stats.geometries;
    }});
    await viewer.load();refresh();
  }catch(e){
    if(viewer){viewer.dispose();viewer=null;}
    loadState("error","無法進入 3D 模式："+e.message);
    notify("仍可使用控制面板及繁體中文說明書；請重試或重新整理。");
  }finally{loading=false;}
}
qs("retryButton").addEventListener("click",()=>begin());
let lastTick=performance.now();
setInterval(()=>{
  const now=performance.now(),elapsed=(now-lastTick)/1000;lastTick=now;
  if(advance(state,elapsed)){refresh();notify(state.last);}
  else if(state.apuStarting)refresh();
},250);
qs("simulator").inert=true;
qs("enterButton").focus();
refresh();
