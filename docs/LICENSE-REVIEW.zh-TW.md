# A320 開源資產授權審查

審查日期：2026-11-18

## 法律與技術判定

| 資產 | 授權與處理 |
| --- | --- |
| FlightGear A320-family 原始模型 | GPL-2.0；允許依授權條款修改、再散布。 |
| radebit 衍生的 cockpit.glb、manifest | THIRD_PARTY_NOTICES 明確標示 FlightGear A320-family 衍生 GPL-2.0 資產；可在保留來源、著作權、完整對應原始資料等義務下匯入。 |
| radebit 網站原始碼 | **不採用**；GitHub 儲存庫沒有明確的整體程式碼授權。 |
| FlyByWire A32NX | **不採用程式或資產**；GPL-3.0 與其他權利問題需另外處理。 |
| OpenA3XX Flightdeck | **不採用程式或資產**；GPL-3.0。 |
| Three.js | MIT 授權，固定版本 CDN 載入。 |
| 本專案自行撰寫的網站程式 | GPL-2.0-only。 |

## 固定來源

- 模型來源 repository：https://github.com/legoboyvdlp/A320-family
- 原始 FlightGear 來源修訂：fec1ecba767c8fffd145337b27012e89c01e3ade
- GLB 轉換檔及署名記錄：https://github.com/radebit/flight-simulator/tree/b2afd173081aea5db00031baa1003aa7c46a789a/public/models/a320
- 上游第三方聲明：https://github.com/radebit/flight-simulator/blob/b2afd173081aea5db00031baa1003aa7c46a789a/THIRD_PARTY_NOTICES.md

## 待匯入模型檔案及 Git blob SHA 校驗值

| 檔案 | 預期 Git blob SHA-1 |
| --- | --- |
| cockpit.glb | b9f584c21f00fba72e31aeb08a2a521fd44c14a7 |
| cockpit-manifest.json | e6aad61c33116bb8e8bbfac11e7b03fff5c4c2d3 |
| flightgear-source.tar.gz | d327b3b21c7d6ccbe7f50bf3fcf292f1d897260a |
| LICENSE.txt | 23cb790338e191e29205d6f4123882c0583ef8eb |
| NOTICE.txt | 65aadd6656f1c8ccd5c9e8b47035c768db5ce9ad |

GitHub Actions 下載後先以 git hash-object 逐項比對，再提交到功能分支。模型需和授權全文、原始 AC3D 與貼圖、修改聲明及轉換腳本一起提供，符合 GPLv2 對對應來源的義務。網站提供同站來源下載連結。

## 風險與限制

- 目前沒有在本執行環境直接取得及檢驗大型二進位模型，必須進一步確認 Actions 匯入成功。
- 現成模型的個別材質、原始作者來源與版權聲明應在匯入後再次人工審查。
- 尚未驗證真實手機效能、模型節點、螢幕 UV 座標與完整互動一致性。
- GPLv2 下模型與原始資料的相同位置可取得性非常重要；不能只提供未經核對的上游主分支連結。
- 這份工程審查不是律師正式法律意見。

## 授權參考

- https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
- https://www.gnu.org/licenses/gpl-faq.html
