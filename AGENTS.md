# Airplane-cockpit 工程約束

- 目標：A320neo 網頁駕駛艙，繁體中文指南；非認證航空訓練工具。
- 禁止將選定目標當成實際飛行狀態；未實作功能必須清楚標示。
- src/app.mjs 負責 UI 與啟動；viewer.mjs 負責渲染生命週期；views.mjs 負責鏡頭；interaction.mjs 負責控制器識別；displays.mjs 負責航電畫面；sim.mjs 負責狀態。
- GPL-2.0 資產必須保留完整對應來源、授權及署名；不得引入無授權程式或不相容素材。更新資產需重新審查五項雜湊。
- 變更前讀 README、docs/ROADMAP.zh-TW.md；保持小範圍 PR，不直接改 main。
- 驗證：for file in src/*.mjs; do node --check "$file"; done；node --test tests/sim.test.mjs；bash scripts/verify-assets.sh；瀏覽器 smoke。區分 CI、公開部署和真機證據。
