import EnterCallName from "./components/EnterCallName"
import EnterLobby from "./components/EnterLobby"
import PlayerView from "./components/PlayerView"
import LobbyDisplay from "./components/Lobby.tsx"
function App() {

  return(
    <>
      <EnterCallName></EnterCallName>
      <EnterLobby></EnterLobby>
      <LobbyDisplay></LobbyDisplay>
      <PlayerView></PlayerView>
    </>
  )
    
}

export default App
