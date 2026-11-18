# Airplane-cockpit — Airbus A320neo 3D Flight Deck

以繁體中文操作說明書作為網站入口的 A320neo 駕駛艙原型。

**警告：** 本專案為地面操作展示，不是完整飛行模擬器、原廠操作手冊或真實航空訓練設備。

## 啟動

本專案為靜態網站，不需 npm 建置。請在專案目錄執行：

    python3 -m http.server 8000

然後開啟 http://localhost:8000/ 。每次進入網站，會先出現繁體中文操作指南；按「我已閱讀，進入駕駛艙」後，才開始載入 3D 模型。

## 已規劃功能

- FlightGear 衍生的 GPL-2.0 A320neo 駕駛艙模型，六種鏡頭預設與自由視角。
- 可選取部分 3D 控制器；右側面板提供 BAT、EXT PWR、APU、FCU 的獨立簡化示意操作。
- PFD、ND、ECAM、MCDU 若能正確識別顯示器網格，會映射到簡化的動態螢幕；並非完整航電。
- 支援手機觸控、桌面滑鼠與 WebGL 渲染；尚未完成裝置效能測試。
- 明確標示尚未實作的 AP1、引擎、完整 FMGS、自動駕駛、飛行物理及真實程序。

## 模型資產

優先使用本專案 public/assets/a320/cockpit.glb。功能分支包含 GitHub Actions 資產匯入流程，下載固定上游版本並逐檔驗證 Git blob 雜湊，連同對應來源檔、GPL 授權全文及修改聲明提交。若尚未匯入完成，網頁會使用固定上游 commit 的已標示 GPL-2.0 模型資產備援。

上游：

- FlightGear A320-family（GPL-2.0）：https://github.com/legoboyvdlp/A320-family
- 轉換後的 GPLv2 資產來源：https://github.com/radebit/flight-simulator/tree/b2afd173081aea5db00031baa1003aa7c46a789a/public/models/a320
- FlightGear 原始模型版本：fec1ecba767c8fffd145337b27012e89c01e3ade

**沒有複製** radebit/flight-simulator 未明確授權的網站原始碼，亦沒有混入 FlyByWire 與 OpenA3XX 的 GPL-3.0 程式碼。

本專案新撰寫的程式採 GPL-2.0-only；Three.js 透過固定版本 CDN 提供，原授權 MIT。

## 自動驗證

    node --check src/app.mjs
    node --check src/sim.mjs
    node --test tests/sim.test.mjs

這些測試不代表模型已完成下載、3D 互動或實機效能驗收。

## GitHub Pages

合併功能分支後，從 GitHub Settings → Pages 將 Source 設為 GitHub Actions。已提供網站部署工作流程，正式網址仍以成功部署後顯示為準。

說明文件：

- [繁中操作說明書](docs/MANUAL.zh-TW.md)
- [授權與來源審查](docs/LICENSE-REVIEW.zh-TW.md)
