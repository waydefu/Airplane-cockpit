// SPDX-License-Identifier: GPL-2.0-only
// Browser regression: keep load phase independent, verify actual GLB and mobile layout.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser=await chromium.launch({
  channel:"chrome",headless:true,
  args:["--use-gl=angle","--use-angle=swiftshader","--enable-webgl"]
});
const errors=[];
const url=process.env.SMOKE_URL || "http://127.0.0.1:8000/";
const phase=page=>page.locator("#loadStatus").getAttribute("data-phase");
async function expectReady(page){
  await page.waitForFunction(()=>{
    const p=document.querySelector("#loadStatus")?.dataset.phase;
    return p==="ready"||p==="error";
  },null,{timeout:120000});
  const p=await phase(page);
  const message=await page.locator("#loadStatus").textContent();
  console.log("GLB viewer:",p,message);
  assert.equal(p,"ready",message);
  assert.ok((await page.locator("#world").evaluate(el=>el.width))>0,"3D canvas buffer missing");
}
async function modelPoint(page,view,id){
  return await page.evaluate(async ({view,id})=>{
    const THREE=await import("three");
    const {views}=await import(new URL("./src/views.mjs",document.baseURI).href);
    const manifest=await (await fetch("./public/assets/a320/cockpit-manifest.json")).json();
    const entry=manifest.parts.find(p=>p.name===id);
    if(!entry)throw Error("missing control "+id);
    const v=views[view],rect=document.querySelector("#world").getBoundingClientRect();
    const camera=new THREE.PerspectiveCamera(v.f,rect.width/rect.height,.015,150);
    camera.position.set(...v.p);camera.lookAt(...v.t);camera.updateMatrixWorld(true);
    const center=new THREE.Vector3(...entry.min.map((x,i)=>(x+entry.max[i])/2)).project(camera);
    const x=rect.left+(center.x+1)*rect.width/2,y=rect.top+(1-center.y)*rect.height/2;
    return {x,y,hit:document.elementFromPoint(x,y)?.id};
  },{view,id});
}
async function cockpitClick(page,view,id,touch=false){
  const p=await modelPoint(page,view,id);
  assert.equal(p.hit,"world",id+" projected point is obscured at "+JSON.stringify(p));
  if(touch)await page.touchscreen.tap(p.x,p.y);
  else await page.mouse.click(p.x,p.y);
  console.log("3D pick",id,p,await page.locator("#targetInfo").textContent());
}
try{
  // CDN failure must not prevent manual dismissal or fallback controls.
  const blocked=await browser.newPage({viewport:{width:1280,height:800}});
  await blocked.route("https://cdn.jsdelivr.net/**",route=>route.abort());
  await blocked.goto(url,{waitUntil:"domcontentloaded"});
  await blocked.locator("#enterButton").click();
  await blocked.waitForFunction(()=>document.querySelector("#loadStatus")?.dataset.phase==="error");
  assert.equal(await blocked.locator("#manualModal").isVisible(),false);
  assert.equal(await blocked.locator("#retryButton").isVisible(),true);
  await blocked.locator('[data-control="ExtPwrBtn"]').click();
  assert.equal(await blocked.locator("#powerReadout").textContent(),"AC POWER");
  await blocked.close();
  // Deliberately slow down GLB download to reproduce interaction/loading race.
  const desktop=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
  desktop.on("pageerror",error=>errors.push("desktop: "+error.message));
  await desktop.route("**/public/assets/a320/cockpit.glb",async route=>{
    await new Promise(resolve=>setTimeout(resolve,1300));
    await route.continue();
  });
  await desktop.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(await desktop.locator("html").getAttribute("lang"),"zh-Hant-TW");
  assert.equal(await desktop.locator("#manualModal").isVisible(),true);
  assert.equal(await phase(desktop),"idle");
  await desktop.locator("#enterButton").click();
  assert.equal(await desktop.locator("#manualModal").isVisible(),false);
  await desktop.locator('[data-control="BatteryBtn1"]').click();
  assert.equal(await desktop.locator("#bat1Readout").textContent(),"AUTO");
  await desktop.locator('[data-control="ExtPwrBtn"]').click();
  assert.equal(await desktop.locator("#powerReadout").textContent(),"AC POWER");
  await desktop.locator('[data-adjust="heading"][data-delta="1"]').click();
  assert.equal(await desktop.locator("#headingReadout").textContent(),"001");
  // Regression: feedback must never replace the durable loading status.
  assert.ok(["loading","ready"].includes(await phase(desktop)));
  await expectReady(desktop);
  await desktop.locator('[data-adjust="heading"][data-delta="1"]').click();
  assert.equal(await phase(desktop),"ready","post-load control feedback reset load state");
  assert.equal(await desktop.locator("#headingReadout").textContent(),"002");
  await desktop.locator("#manualButton").click();
  assert.equal(await desktop.locator("#manualModal").isVisible(),true);
  await desktop.locator("#enterButton").click();
  assert.equal(await phase(desktop),"ready");
  // Real mesh/raycast path, not just duplicate HTML buttons.
  await desktop.locator("#resetButton").click();
  await desktop.locator("#sideToggle").click();
  await desktop.locator('[data-view="power"]').click();
  await cockpitClick(desktop,"power","BatteryBtn1");
  assert.equal(await desktop.locator("#bat1Readout").textContent(),"AUTO");
  await cockpitClick(desktop,"power","BatteryBtn2");
  assert.equal(await desktop.locator("#bat2Readout").textContent(),"AUTO");
  await cockpitClick(desktop,"power","ExtPwrBtn");
  assert.equal(await desktop.locator("#powerReadout").textContent(),"AC POWER");
  await desktop.locator('[data-view="fcu"]').click();
  await cockpitClick(desktop,"fcu","hdg_sel");
  assert.equal(await desktop.locator("#headingReadout").textContent(),"001");
  await desktop.screenshot({path:"a320-browser-smoke.png",fullPage:true});
  // Important: stop the desktop 3D render loop before emulating mobile touch.
  // Keeping both software-rendered GLB scenes alive can starve Chromium's touch dispatcher.
  await desktop.close();

  // A genuine mobile viewport with touch, not simply resizing the desktop page.
  const mobileContext=await browser.newContext({
    viewport:{width:393,height:873},deviceScaleFactor:1,isMobile:true,hasTouch:true
  });
  const mobile=await mobileContext.newPage();
  mobile.on("pageerror",error=>errors.push("mobile: "+error.message));
  // Hold GLB while testing touch UI; browser software-rendering must not starve actions.
  let allowMobileModel;
  const mobileModelGate=new Promise(resolve=>{allowMobileModel=resolve;});
  await mobile.route("**/public/assets/a320/cockpit.glb",async route=>{
    await mobileModelGate;
    await route.continue();
  });
  await mobile.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
  await mobile.waitForFunction(()=>document.querySelector("#sideToggle")?.getAttribute("aria-expanded")==="false");
  assert.equal(await mobile.locator("#manualModal").isVisible(),true);
  assert.equal(await mobile.locator("#sidePanel").isVisible(),false,"Mobile cockpit controls cover model at startup");
  await mobile.locator("#enterButton").tap();
  const centerHit=await mobile.evaluate(()=>{
    const e=document.elementFromPoint(innerWidth/2,innerHeight/2);
    return {id:e?.id,tag:e?.tagName};
  });
  assert.equal(centerHit.id,"world","3D canvas center blocked on portrait mobile");
  const toggleRect=await mobile.locator("#sideToggle").boundingBox();
  assert.ok(toggleRect&&toggleRect.x>=0&&toggleRect.x+toggleRect.width<=393,
    "mobile panel toggle must fit inside the viewport");
  await mobile.locator("#sideToggle").tap();
  assert.equal(await mobile.locator("#sidePanel").isVisible(),true);
  const panelBox=await mobile.locator("#sidePanel").boundingBox();
  assert.ok(panelBox&&panelBox.y>873*.5,"Open mobile drawer obstructs top half of 3D cockpit");
  await mobile.locator('[data-control="BatteryBtn1"]').tap();
  await mobile.locator('[data-control="ExtPwrBtn"]').tap();
  await mobile.locator('[data-adjust="heading"][data-delta="1"]').tap();
  assert.equal(await mobile.locator("#headingReadout").textContent(),"001");
  await mobile.locator('[data-view="overhead"]').tap();
  assert.equal(await mobile.locator("#sidePanel").isVisible(),false,"Mobile viewpoint change must close drawer");
  assert.equal(await phase(mobile),"loading","interaction must not overwrite in-flight model status");
  allowMobileModel();
  await expectReady(mobile);
  assert.equal(await phase(mobile),"ready");
  await mobile.locator('[data-view="power"]').tap();
  await cockpitClick(mobile,"power","BatteryBtn2",true);
  assert.equal(await mobile.locator("#bat2Readout").textContent(),"AUTO","post-load mobile 3D BAT2 tap");
  await mobile.locator('[data-view="fcu"]').tap();
  await cockpitClick(mobile,"fcu","hdg_sel",true);
  assert.equal(await mobile.locator("#headingReadout").textContent(),"002","post-load mobile 3D FCU tap");
  await mobile.screenshot({path:"a320-mobile-portrait.png",fullPage:true});
  await mobileContext.close();
  assert.deepEqual(errors,[],"browser page errors");
  console.log("PASS: desktop GLB load race + 393x873 portrait touch layout");
}finally{
  await browser.close();
}
