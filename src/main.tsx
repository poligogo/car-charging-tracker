import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// 註冊 Service Worker
registerSW({
  onNeedRefresh() {
    // 有新版本時的處理
    if (confirm('有新版本可用，是否更新？')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('應用程式已可離線使用')
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
