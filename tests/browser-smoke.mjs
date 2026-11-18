// SPDX-License-Identifier: GPL-2.0-only
// GitHub Actions browser smoke: live DOM, controls, and a 3D GLB load.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser=await chromium.launch({
  channel:"chrome",headless:true,
  args:["--use-gl=angle","--use-angle=swiftshader","--enable-webgl"]
});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
const errors=[];
page.on("pageerror",err=>errors.push(err.message));
try{
  await page.goto("http://127.0.0.1:8000/",{waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(await page.locator("html").getAttribute("lang"),"zh-Hant-TW");
  assert.equal(await page.locator("#manualModal").isVisible(),true);
  assert.equal(await page.locator("#loadStatus").textContent(),"請先閱讀操作說明");
  await page.locator("#enterButton").click();
  assert.equal(await page.locator("#manualModal").isVisible(),false);
  await page.locator('[data-control="BatteryBtn1"]').click();
  assert.equal(await page.locator("#bat1Readout").textContent(),"AUTO");
  await page.locator('[data-control="ExtPwrBtn"]').click();
  assert.equal(await page.locator("#powerReadout").textContent(),"AC POWER");
  await page.locator('[data-adjust="heading"][data-delta="1"]').click();
  assert.equal(await page.locator("#headingReadout").textContent(),"001");
  await page.locator("#manualButton").click();
  assert.equal(await page.locator("#manualModal").isVisible(),true);
  await page.locator("#enterButton").click();
  await page.waitForFunction(()=>{
    const text=document.querySelector("#loadStatus")?.textContent||"";
    return text.includes("載入完成")||text.includes("無法進入 3D 模式");
  },null,{timeout:120000});
  const finalStatus=await page.locator("#loadStatus").textContent();
  console.log("GLB viewer:",finalStatus);
  assert.ok(finalStatus.includes("載入完成"),"3D GLB did not load successfully");
  assert.ok((await page.locator("#world").evaluate(c=>c.width))>0,"WebGL canvas has no backing buffer");
  assert.deepEqual(errors,[],"browser page errors");
  await page.screenshot({path:"a320-browser-smoke.png",fullPage:true});
}finally{
  await browser.close();
}
