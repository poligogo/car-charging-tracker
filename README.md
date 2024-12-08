# 電動車充電記錄應用

一個用於追蹤和管理電動車充電記錄的 Web 應用程式。

## 功能特點

### 車輛管理
- 新增/編輯/刪除車輛
- 設置預設車輛
- 支援車輛圖片上傳
- 記錄購買日期

### 充電記錄
- 記錄充電詳細資訊
  - 日期和時間
  - 充電站資訊
  - 充電規格
  - 電量和費用
  - 里程記錄
- 自動計算充電費用
- 支援多種計費方式（按度數/按時間）

### 維修記錄
- 記錄維修項目和費用
- 追蹤維修歷史
- 記錄下次保養里程
- 支援多項目明細

### 數據統計
- 月度充電統計
- 總費用統計
- 平均電價計算
- 充電次數統計

### 資料管理
- 匯出充電記錄 (CSV)
- 匯出維修記錄 (CSV)
- 匯出到 Google Drive
- 資料匯入功能

## 技術架構

- 前端框架：React + TypeScript
- UI 框架：Ant Design Mobile
- 狀態管理：Zustand
- 本地儲存：Dexie.js (IndexedDB)
- 建置工具：Vite
- 部署平台：Vercel

## 開發指南

### 安裝依賴

```bash
yarn install
```

### 開發環境運行

```bash
yarn dev
```

### 建置專案

```bash
yarn build
```

### 環境變數設置
建立 `.env` 文件並設置：
```
VITE_GOOGLE_CLIENT_ID=你的Google客戶端ID
```

## 部署說明

本專案使用 Vercel 進行部署，需要設置以下環境變數：
- `VITE_GOOGLE_CLIENT_ID`：Google Drive API 的客戶端 ID

## 注意事項

- 所有數據都儲存在瀏覽器的 IndexedDB 中
- Google Drive 功能需要有效的 Google API 憑證
- 建議定期備份重要數據

## 授權協議

MIT License
