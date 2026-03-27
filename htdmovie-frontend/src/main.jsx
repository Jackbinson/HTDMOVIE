import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 1. Import BrowserRouter từ thư viện vừa cài
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Bọc BrowserRouter ra bên ngoài thẻ App */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)