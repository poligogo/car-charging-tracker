# Changelog

## [1.0.0] - 2024-03-19

### 新增功能
- 車輛管理（新增/編輯/刪除/設置預設車輛）
- 充電記錄管理
- 維修記錄管理
- 數據統計功能
- CSV 匯出/匯入功能
- Google Drive 整合

### 技術改進
- 修復 IndexedDB 錯誤處理機制
- 優化 Dexie.js 數據庫初始化流程
- 改進路由配置，解決 Vercel 部署 404 問題
- 移除 PWA 相關功能，提高穩定性

### 重要文件更新
- `src/services/db.ts`: 改進數據庫錯誤處理
- `vercel.json`: 優化路由配置
- `vite.config.ts`: 移除 PWA 配置
- `README.md`: 完整功能文檔

### 部署說明
- 平台：Vercel
- 環境變數：
  - `VITE_GOOGLE_CLIENT_ID`：Google Drive API 憑證
- 部署命令：`yarn build`

### 注意事項
- 需要設置有效的 Google API 憑證
- 所有數據存儲在瀏覽器的 IndexedDB 中
- 建議定期備份數據到 Google Drive 