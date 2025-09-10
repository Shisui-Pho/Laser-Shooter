import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { lobbyService } from "../services/LobbyServices.ts";

//Component for entering or creating a game lobby
const EnterLobby: React.FC = () => {
  //Access game context for lobby and user information
  const { user, setUser, lobby, setLobby } = useGame();
  
  //State for lobby code input field
  const [code, setCode] = useState("");
  
  //State for maximum players input field
  const [maxPlayers, setMaxPlayers] = useState<number>(2);//Default is 2

  //Method to join existing lobby
  const handleJoin = async () => {
    //Return if the user doesn't exist or lobby code is not provided
    if (!user || !code) return;

    //Join Lobby(only players can join lobby)
    if (user.role === "player") {
      //Call service to join lobby
      const response = await lobbyService.joinLobby(code, user.callName);
      
      //Update user context with team assignment
      if (response && response.user) {
        setUser({
          ...user,
          teamId: response.user.team_id,
          hits: response.user.hits,
        });
      }
    }

    //Update global lobby state with the joined lobby code
    setLobby({ ...lobby!, code });
  };

  // Method for creating a new lobby
  const handleCreate = async () => {

    //Check if the max players is even
    if(maxPlayers%2!=0) return;
    //Only players can create lobbies(spectators cannot)
    if (!user || user.role !== "player") return;

    //Call the service to create a new lobby 
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

      //Update user context with team assignment from the new lobby
      if (joinResponse && joinResponse.user) {
        setUser({
          ...user,
          teamId: joinResponse.user.team_id,
          hits: joinResponse.user.hits,
        });
      }
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

      {/*Lobby creation section*/}
      {user && user.role === "player" && (
        <div style={{ marginTop: "1rem" }}>
          {/*Input for specifying maximum players in the new lobby */}
          <input
            type="number"
            min={2}//Minimum 2 players (teams need at least 1 player each)
            step={2}//Even numbers only (to maintain balanced teams)
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