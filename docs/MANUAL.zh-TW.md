# A320neo 3D 駕駛艙 — 繁體中文操作說明書

版本 0.1｜Airplane-cockpit 互動原型。

**重要：不是 Airbus 原廠航空器操作手冊，不可用於實機操作、正式飛行訓練、導航或安全決策。**

## 進入網站

每次進入網站都會顯示繁體中文指南。閱讀後點擊「我已閱讀，進入駕駛艙」，才會開始載入約 50.6 MB 的駕駛艙模型。若網路或 WebGL 無法載入，會在頁面標示錯誤，右側控制面板仍可操作。進入後可隨時點頂部「操作說明」重新閱讀。

## 視角操作

| 功能 | 桌面 | 手機／平板 |
| --- | --- | --- |
| 旋轉鏡頭 | 左鍵拖曳 | 單指拖曳 |
| 放大縮小 | 滑鼠滾輪 | 雙指捏合 |
| 平移 | 右鍵拖曳 | 雙指拖曳 |
| 選取 3D 控制器 | 左鍵點擊 | 單指點擊 |
| 切換視角 | VIEW 按鈕 | VIEW 按鈕 |

預設視角：機長席、主儀表、頂部面板、中央操縱台、MCDU、全景。

## 面板位置

- 左上角：專案名稱與 GitHub 入口。
- 上方：視角、操作說明、開源授權、控制面板切換。
- 右側：電力、APU、ADIRS 與 FCU 選定值。
- 3D 空間：實際模型節點。尚未實作的控制器會告知「僅供檢視」。

## Cold & Dark 示意（非真實檢查單）

1. 點右側 BAT 1、BAT 2，確認顯示 AUTO。
2. 點 EXT PWR，使 AC POWER 顯示接通。此示範預設地面電源可用。
3. 點 APU MASTER。
4. 點 APU START，系統以約八秒進行示意啟動；完成顯示 AVAIL。
5. 可切換 APU GEN、APU BLEED 和 ADIRS 1–3 等示意狀態。
6. 點「重設 Cold & Dark」回到起始狀態。

真實 Airbus A320neo 的電力轉換、APU、ADIRS 對準、液壓及引擎啟動程序複雜許多；此原型不等同於原廠程序。

## FCU

- SPD：100–399，每次 ±1。
- HDG：000–359 度，會循環。
- ALT：00000–49000 ft，每次 ±1000 ft。
- 桌面可點擊 3D 旋鈕遞增，按 Shift 再點擊遞減。手機建議用右側 ± 按鈕。
- 以上只改變示意目標值；**不會讓飛機轉彎、爬升或維持速度**。

## 系統實作狀態

| 控制項 | 現況 |
| --- | --- |
| BAT、EXT PWR、APU MASTER / START / GEN / BLEED | 部分示意邏輯 |
| ADIRS 1–3 | 簡化供電與 NAV 狀態 |
| BEACON、SEAT BELTS、PARK BRK | 簡化切換 |
| FCU SPD、HDG、ALT | 簡化目標數值 |
| FD1、FD2 | 只有示意狀態 |
| AP1 | 未實作 |
| ENG MASTER、ENG MODE | 未實作引擎啟動 |
| FMGS / 自動飛行 / FMA / 真實航圖 | 未實作 |
| 飛行動態、實際空速高度、故障管理 | 未實作 |

若模型中的螢幕顯示文字，僅供示範渲染技術，並非真實機載航電顯示與認證數值。

## 手機及效能

建議 Wi-Fi；模型下載量超過 50 MB。行動裝置會限制渲染像素比以減輕 GPU 壓力。目前並未證明特定裝置可達 60 FPS。若面板遮住畫面，可暫時收起右側控制面板。

## 開源資訊

3D 資產由 FlightGear A320-family 經 GPL-2.0 授權取得，轉換檔衍生來源與修改資訊見授權審查文件。網頁新撰寫的程式為 GPL-2.0-only。

- 原始模型：https://github.com/legoboyvdlp/A320-family
- 衍生資產：https://github.com/radebit/flight-simulator/tree/b2afd173081aea5db00031baa1003aa7c46a789a/public/models/a320
- 專案：https://github.com/waydefu/Airplane-cockpit

本專案與 Airbus、FlightGear、FlyByWire 均無官方背書或合作關係。
