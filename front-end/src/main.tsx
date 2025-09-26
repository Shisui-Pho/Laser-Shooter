//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GameProvider } from "./context/GameContext.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="main-container">
      <GameProvider>
        {/*Wrap the app with game provider*/}
        <App />
      </GameProvider>
    </div>
  </StrictMode>
)
