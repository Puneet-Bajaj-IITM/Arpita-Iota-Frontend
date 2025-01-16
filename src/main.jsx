import React from 'react'
import ReactDOM from 'react-dom/client'
import ModelDashboard from './model-dashboard'
import './index.css'
// import path from "path"
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ModelDashboard />
  </React.StrictMode>,
)
