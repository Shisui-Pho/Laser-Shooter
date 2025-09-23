import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LobbyPage from "./pages/Lobby";
import PlayerViewPage from "./pages/PlayerView";
import SpectatorViewPage from "./pages/SpectatorView";
import EnterLobby from "./components/EnterLobby";
import { ErrorProvider } from "./context/ErrorContext";
import ErrorContainer from "./components/ErrorContainer";
import { GameProvider } from "./context/GameContext";

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
        <Route path="/spectator" element={<SpectatorViewPage />} />
      </Routes>
    </BrowserRouter>
      </GameProvider>
    </ErrorProvider>
    
  );
}

export default App;