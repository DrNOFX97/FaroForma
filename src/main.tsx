import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SITE_META from './config/siteMeta'
import './styles/global.css'
import App from './App'

document.title = SITE_META.title

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
