import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { lobbyService } from "../services/LobbyServices.ts";

//Component for entering or creating a game lobby
const EnterLobby: React.FC = () => {
  //Access game context for lobby and user information
  const { user, setUser, lobby, setLobby } = useGame();
  
  //States
  const [code, setCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<number>(2);//Default is 2

  //Method to join existing lobby
  const handleJoin = async () => {
    //Return if user or lobby code is missing
    if (!user || !code) return;

    //Ensure that only players can join lobbies
    if (user?.role === "player") {
      //Request to join the lobby via the lobby service
      const response = await lobbyService.joinLobby(code, user.callName);

      //Update user data with backend information
      if (response && response.user) {
        setUser({
          ...user,
          id: response.user.id,
          teamId: response.user.team_id,
          hits: response.user.hits,
        });

        //Fetch full lobby details after joining
        const lobbyDetails = await lobbyService.getLobbyDetails(code);
        if (lobbyDetails) {
          //Update the global lobby state with fetched details
          setLobby({
            code,
            users: lobbyDetails.users || [],
            colors: lobbyDetails.colors || [],
            shape: lobbyDetails.shape || "",
            teams: lobbyDetails.teams || [],
          });
        }
      }
    }
  };

  // Method for creating a new lobby
  const handleCreate = async () => {
    //Ensure that the max players is even
    if(maxPlayers%2!=0) return;

    //Only players can create lobbies(spectators cannot)
    if (!user || user.role !== "player") return;

    //Request the lobby service to create a new lobby 
    const createResponse = await lobbyService.createLobby(maxPlayers);
    
    if (createResponse) {
      //Update global lobby state with new lobby details
      setLobby({
        code: createResponse.lobby_code,
        users: [],
        colors: createResponse.colors,
        shape: createResponse.shape,
        teams: createResponse.teams,
      });

      //Update local state with the new lobby code
      setCode(createResponse.lobby_code);

      //Have the host automatically join the newly created lobby
      const joinResponse = await lobbyService.joinLobby(
        createResponse.lobby_code,
        user.callName
      );

      //Update user data with backend information
      if (joinResponse && joinResponse.user) {
        setUser({
          ...user,
          id: joinResponse.user.id,        
          teamId: joinResponse.user.team_id,
          hits: joinResponse.user.hits,
        });
      }
    }
  };

  // Method for spectators to watch a lobby
  const handleSpectate = async () => {
    if (!code) return;

    //Fetch lobby details without joining as a player
    const lobbyDetails = await lobbyService.getLobbyDetails(code);
    if (lobbyDetails) {
      setLobby({
        code,
        users: lobbyDetails.users || [],
        colors: lobbyDetails.colors || [],
        shape: lobbyDetails.shape || "",
        teams: lobbyDetails.teams || [],
      });
    }
  };

  return (
    <div>
      {/*Welcome message displaying user's call name and role */}
      <h2>
        Welcome {user?.callName} ({user?.role})
      </h2>

      {/*Field for entering an existing lobby code*/}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter Lobby Code"
      />
      
      {/*Button to join an existing lobby*/}
      <button onClick={handleJoin}>Join Lobby</button>

      {/*Button for spectators to watch a lobby*/}
      {user && user.role === "spectator" && (
        <button onClick={handleSpectate} style={{ marginLeft: "10px" }}>
          Spectate Lobby
        </button>
      )}

      {/*Lobby creation section*/}
      {user && user.role === "player" && (
        <div style={{ marginTop: "1rem" }}>
          {/*Input for specifying maximum players in the new lobby */}
          <input
            type="number"
            min={2}//Minimum 2 players(teams need at least 1 player each)
            step={2}//Even numbers only(to maintain balanced teams)
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            placeholder="Max Players (even number)"
          />
          
          {/*Button to create a new lobby with specified max players*/}
          <button onClick={handleCreate}>Create Lobby</button>
        </div>
      )}
    </div>
  );
};

export default EnterLobby;
