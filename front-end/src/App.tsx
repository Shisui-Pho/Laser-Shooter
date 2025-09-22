import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LobbyPage from "./pages/Lobby";
import PlayerViewPage from "./pages/PlayerView";
import SpectatorViewPage from "./pages/SpectatorView";
import EnterLobby from "./components/EnterLobby";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/enterLobby" element={<EnterLobby />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/player" element={<PlayerViewPage />} />
        <Route path="/spectator" element={<SpectatorViewPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;