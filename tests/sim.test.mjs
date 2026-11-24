// SPDX-License-Identifier: GPL-2.0-only
import test from "node:test";
import assert from "node:assert/strict";
import {initialState,hasDc,hasAc,operate,advance,adjustFcu,readouts} from "../src/sim.mjs";

test("Cold & Dark means no AC and no DC",()=>{
  const s=initialState();
  assert.equal(hasAc(s),false);
  assert.equal(hasDc(s),false);
  assert.equal(readouts(s).apu,"OFF");
});
test("APU cannot start without power and master",()=>{
  const s=initialState();
  assert.match(operate(s,"APUStartBtn"),/需要/);
  assert.equal(s.apuStarting,false);
  operate(s,"BatteryBtn1");
  assert.equal(hasDc(s),true);
  assert.match(operate(s,"APUStartBtn"),/需要/);
  assert.equal(s.apuStarting,false);
});
test("ground power enables AC and FCU adjustments",()=>{
  const s=initialState();
  assert.match(adjustFcu(s,"heading",1),/無 AC/);
  operate(s,"ExtPwrBtn");
  assert.equal(hasAc(s),true);
  assert.match(operate(s,"hdg_sel"),/001/);
  assert.equal(s.heading,1);
  assert.equal(adjustFcu(s,"speed",-1),"SPEED → 249");
});
test("APU starter transitions to AVAIL and supplies AC when generator selected",()=>{
  const s=initialState();
  operate(s,"BatteryBtn1");
  operate(s,"APUMasterBtn");
  operate(s,"APUStartBtn");
  assert.equal(s.apuStarting,true);
  assert.equal(advance(s,7),false);
  assert.equal(s.apuAvailable,false);
  assert.equal(advance(s,1),true);
  assert.equal(s.apuAvailable,true);
  assert.equal(hasAc(s),true);
  operate(s,"APUGenBtn");
  assert.equal(hasAc(s),false);
});
test("turning master off cancels startup and bleed",()=>{
  const s=initialState();
  operate(s,"BatteryBtn2");
  operate(s,"APUMasterBtn");
  operate(s,"APUStartBtn");
  advance(s,8);
  operate(s,"APUBleedBtn");
  assert.equal(s.apuBleed,true);
  operate(s,"APUMasterBtn");
  assert.equal(s.apuAvailable,false);
  assert.equal(s.apuBleed,false);
});
test("headings wrap and altitude respects limits",()=>{
  const s=initialState();operate(s,"ExtPwrBtn");
  adjustFcu(s,"heading",-1);assert.equal(s.heading,359);
  adjustFcu(s,"heading",2);assert.equal(s.heading,1);
  adjustFcu(s,"altitude",100000);assert.equal(s.altitude,49000);
  adjustFcu(s,"altitude",-100000);assert.equal(s.altitude,0);
});
test("unimplemented controls never claim real autopilot or engine action",()=>{
  const s=initialState();
  assert.match(operate(s,"ap1"),/尚未實作/);
  assert.match(operate(s,"Lcutoff"),/尚未實作/);
  assert.equal(s.apuAvailable,false);
});
test("ADIRS requires AC power",()=>{
  const s=initialState();
  assert.match(operate(s,"IR1ModeKnb"),/需先供電/);
  operate(s,"ExtPwrBtn");
  operate(s,"IR1ModeKnb");assert.equal(s.ir[0],true);
});

test("loss of DC aborts pending APU startup",()=>{
 const s=initialState();operate(s,"BatteryBtn1");operate(s,"APUMasterBtn");operate(s,"APUStartBtn");advance(s,4);operate(s,"BatteryBtn1");assert.equal(s.apuStarting,false);assert.equal(s.apuSeconds,0);operate(s,"BatteryBtn1");advance(s,8);assert.equal(s.apuAvailable,false);
});
test("loss of AC clears powered FD and ADIRS flags",()=>{
 const s=initialState();assert.match(operate(s,"fd1"),/供電/);operate(s,"ExtPwrBtn");operate(s,"fd1");operate(s,"IR1ModeKnb");operate(s,"ExtPwrBtn");assert.deepEqual(s.fd,[false,false]);assert.deepEqual(s.ir,[false,false,false]);assert.equal(readouts(s).ir,"OFF");
});
test("FCU rejects nonfinite or fractional inputs and wraps arbitrary integer headings",()=>{
 const s=initialState();operate(s,"ExtPwrBtn");for(const x of [NaN,Infinity,0.5,"5"])assert.match(adjustFcu(s,"heading",x),/無效/);adjustFcu(s,"heading",-7201);assert.equal(s.heading,359);
});
