import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

// تحسين الأداء للموبايل
const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// إضافة معالج للأخطاء العامة
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error)
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason)
})

// تحسين الأداء - تحميل مسبق للموارد
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // تحميل مسبق للخطوط أو الموارد الأخرى
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = '/sw.js'
    document.head.appendChild(link)
  })
}