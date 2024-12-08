import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { GoogleDriveService } from './services/googleDrive'

// 預先初始化 Google API
const initGoogleApi = async () => {
  try {
    console.log('開始預初始化 Google API...')
    const driveService = GoogleDriveService.getInstance()
    await driveService.init()
    console.log('Google API 預初始化完成')
  } catch (error) {
    console.error('Google API 預初始化失敗:', error)
  }
}

// 在應用啟動時初始化
initGoogleApi()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
