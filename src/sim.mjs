// SPDX-License-Identifier: GPL-2.0-only
// Independent A320 ground interaction mock. Not for real aircraft operation.
export const CONTROL_LABELS=Object.freeze({
BatteryBtn1:"BAT 1",BatteryBtn2:"BAT 2",ExtPwrBtn:"EXT PWR",
APUMasterBtn:"APU MASTER",APUStartBtn:"APU START",APUGenBtn:"APU GEN",APUBleedBtn:"APU BLEED",
IR1ModeKnb:"ADIRS 1",IR2ModeKnb:"ADIRS 2",IR3ModeKnb:"ADIRS 3",
BeaconLtSwtch:"BEACON",SeatBeltSwtch:"SEAT BELTS",ParkBrk:"PARK BRK",
"spd-sel":"FCU SPD",hdg_sel:"FCU HDG","alt-sel":"FCU ALT",
fd1:"FD 1",fd2:"FD 2",ap1:"AP 1",Lcutoff:"ENG MASTER 1",Rcutoff:"ENG MASTER 2",eng_mode:"ENG MODE"
});
export function initialState(){return {
batteries:[false,false],externalConnected:true,externalPower:false,
apuMaster:false,apuStarting:false,apuAvailable:false,apuSeconds:0,
apuGenerator:true,apuBleed:false,ir:[false,false,false],
beacon:false,seatbelts:false,parkingBrake:true,fd:[false,false],
speed:250,heading:0,altitude:1000,last:"冷艙已就緒，請依序接通電源"
};}
export function hasAc(s){return !!(s.externalPower||(s.apuAvailable&&s.apuGenerator));}
export function hasDc(s){return !!(s.externalPower||s.batteries.some(Boolean)||hasAc(s));}
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function adjustFcu(s,key,delta){
if(!Number.isSafeInteger(delta))return "無效 FCU 增量";
if(!hasAc(s))return "無 AC 電源：無法調整 FCU";
if(key==="speed")s.speed=clamp(s.speed+delta,100,399);
else if(key==="heading")s.heading=((s.heading+delta%360)%360+360)%360;
else if(key==="altitude")s.altitude=clamp(s.altitude+delta,0,49000);
else return "不支援的 FCU 參數";
return key.toUpperCase()+" → "+(key==="heading"?String(s.heading).padStart(3,"0"):s[key]);
}
export function operate(s,id,direction=1){
let t="";
switch(id){
case "BatteryBtn1":s.batteries[0]=!s.batteries[0];t="BAT 1 → "+(s.batteries[0]?"AUTO":"OFF");break;
case "BatteryBtn2":s.batteries[1]=!s.batteries[1];t="BAT 2 → "+(s.batteries[1]?"AUTO":"OFF");break;
case "ExtPwrBtn":if(!s.externalConnected){t="外部電源未連接";break;}s.externalPower=!s.externalPower;t="EXT PWR → "+(s.externalPower?"ON":"OFF");break;
case "APUMasterBtn":
if(!hasDc(s)&&!s.apuMaster){t="請先接通電池或外部電源";break;}
s.apuMaster=!s.apuMaster;
if(!s.apuMaster){s.apuStarting=false;s.apuAvailable=false;s.apuSeconds=0;s.apuBleed=false;}
t="APU MASTER → "+(s.apuMaster?"ON":"OFF");break;
case "APUStartBtn":
if(!s.apuMaster||!hasDc(s)){t="需要 APU MASTER 與 DC 供電";break;}
if(s.apuStarting||s.apuAvailable){t="APU 已在啟動或可用狀態";break;}
s.apuStarting=true;s.apuSeconds=0;t="APU START：模擬啟動程序";break;
case "APUGenBtn":s.apuGenerator=!s.apuGenerator;t="APU GEN → "+(s.apuGenerator?"ON":"OFF");break;
case "APUBleedBtn":
if(!s.apuAvailable&&!s.apuBleed){t="APU 尚未就緒";break;}
s.apuBleed=!s.apuBleed;t="APU BLEED → "+(s.apuBleed?"ON":"OFF");break;
case "IR1ModeKnb":case "IR2ModeKnb":case "IR3ModeKnb":{
if(!hasAc(s)){t="ADIRS 需先供電";break;}
const i=Number(id[2])-1;s.ir[i]=!s.ir[i];t="ADIRS "+(i+1)+" → "+(s.ir[i]?"NAV（示意）":"OFF");break;}
case "BeaconLtSwtch":s.beacon=!s.beacon;t="BEACON → "+(s.beacon?"ON":"OFF");break;
case "SeatBeltSwtch":s.seatbelts=!s.seatbelts;t="SEAT BELTS → "+(s.seatbelts?"ON":"OFF");break;
case "ParkBrk":s.parkingBrake=!s.parkingBrake;t="PARK BRK → "+(s.parkingBrake?"ON":"OFF");break;
case "fd1":case "fd2":{if(!hasAc(s)){t="FD 需先供電";break;}const i=Number(id[2])-1;s.fd[i]=!s.fd[i];t="FD "+(i+1)+" → "+(s.fd[i]?"ON":"OFF")+"（未接入飛行物理）";break;}
case "spd-sel":t=adjustFcu(s,"speed",direction);break;
case "hdg_sel":t=adjustFcu(s,"heading",direction);break;
case "alt-sel":t=adjustFcu(s,"altitude",1000*direction);break;
case "ap1":t="AP 1 尚未實作，不會啟用自動駕駛";break;
case "Lcutoff":case "Rcutoff":case "eng_mode":t="引擎系統尚未實作，控制器不會啟動引擎";break;
default:t="控制器 "+id+" 尚未接入";break;
}
if(!hasAc(s)){s.ir.fill(false);s.fd.fill(false);}
if(s.apuStarting&&!hasDc(s)){s.apuStarting=false;s.apuSeconds=0;t+=" · APU 啟動因斷電中止";}
s.last=t;return t;
}
export function advance(s,seconds){
if(!Number.isFinite(seconds)||seconds<=0)return false;
if(s.apuStarting&&(!s.apuMaster||!hasDc(s))){s.apuStarting=false;s.apuSeconds=0;s.last="APU 啟動中止";return true;}
if(s.apuStarting&&s.apuMaster&&hasDc(s)){
s.apuSeconds+=seconds;
if(s.apuSeconds>=8){s.apuSeconds=8;s.apuStarting=false;s.apuAvailable=true;s.last="APU AVAIL（簡化啟動模擬）";return true;}
}
return false;
}
export function readouts(s){return {
power:hasAc(s)?"AC POWER":"OFF",external:s.externalPower?"ON":s.externalConnected?"AVAIL":"DISCONNECTED",
apu:s.apuAvailable?"AVAIL":s.apuStarting?"START "+Math.floor(s.apuSeconds/8*100)+"%":s.apuMaster?"MASTER ON":"OFF",
ir:hasAc(s)&&s.ir.some(Boolean)?s.ir.filter(Boolean).length+"/3 NAV（示意）":"OFF",
batteries:s.batteries.map(v=>v?"AUTO":"OFF"),
speed:String(s.speed).padStart(3,"0"),heading:String(s.heading).padStart(3,"0"),altitude:String(s.altitude).padStart(5,"0")
};}