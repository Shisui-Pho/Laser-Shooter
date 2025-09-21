import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GameProvider } from "./context/GameContext.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="main-container">
      <GameProvider>
        <App />
      </GameProvider>
    </div>
  </StrictMode>
)
