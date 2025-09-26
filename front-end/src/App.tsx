//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LobbyPage from "./pages/Lobby";
import PlayerViewPage from "./pages/PlayerView";
import EnterLobby from "./components/EnterLobby";
import { ErrorProvider } from "./context/ErrorContext";
import ErrorContainer from "./components/ErrorContainer";
import { GameProvider } from "./context/GameContext";

//App component that defines routes and wraps children with relevant contexts
function App() {
  return (
    <ErrorProvider>
      <GameProvider>
        <BrowserRouter>
        <ErrorContainer/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/enterLobby" element={<EnterLobby />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/player" element={<PlayerViewPage />} />
      </Routes>
    </BrowserRouter>
      </GameProvider>
    </ErrorProvider>
    
  );
}

export default App;