import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { lobbyService } from "../services/LobbyServices.ts";
import { useNavigate } from 'react-router-dom';
import "../pages/Home/index.css";
import { useError } from "../context/ErrorContext";

//Component for entering or creating a game lobby
const EnterLobby: React.FC = () => {
  //Access game context for lobby and user information
  const { user, setUser, lobby, setLobby } = useGame();
  const { addError } = useError();
  const navigate = useNavigate();
  //States
  const [code, setCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<number>(2);//Default is 2

  //Method to join existing lobby
  const handleJoin = async () => {

    //Return if user or lobby code is missing
    if (!user || !code){
        addError("Enter a lobby code","warning")
      return;
    } 

    try{
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
              game_status: lobbyDetails.game_status, 
              time_remaining: 60
            });
          }
          else{
            addError("Lobby not found", "error");
          }
          //redirect to the lobby waiting room
          navigate('/lobby', {replace: true})
        }
        else{
          addError("Server did not respond", "error");
        }
      }
      else{
        addError("Failed to join lobby", "error");
      }
    }
    catch(ex){
      addError(ex instanceof Error ? ex.toString() : String(ex), "error");
    }
    
  };

  // Method for creating a new lobby
  const handleCreate = async () => {
    //Ensure that the max players is even
    if(maxPlayers%2!=0){
      addError("Number of players must be even","error");
      return;
    };

    //Only players can create lobbies(spectators cannot)
    if (!user || user.role !== "player") return;

    try{
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
            game_status: "not_started", 
            time_remaining: 60
          });

          //Update local state with the new lobby code
          console.log(createResponse.lobby_code);
          setCode(createResponse.lobby_code);
          addError("Lobby Created Successfully","info");
          addError("Share Lobby Code & Click Join Lobby","info");

          //Handle join will join the user

          // const joinResponse = await lobbyService.joinLobby(
          // 	 createResponse.lobby_code,
          // 	 user.callName
          // );

          // //Update user data with backend information
          // if (joinResponse && joinResponse.user) {
          // 	 setUser({
          // 	 	 ...user,
          // 	 	 id: joinResponse.user.id, 		
          // 	 	 teamId: joinResponse.user.team_id,
          // 	 	 hits: joinResponse.user.hits,
          // 	 });
          // }
        }
        else{
          addError("Failed to create lobby","error");
        }
    }
    catch(ex){
      addError(ex instanceof Error ? ex.toString() : String(ex), "error");
    }
    
  };

  //Method for spectators to watch a lobby
  const handleSpectate = async () => {
    if (!code){
      addError("Enter a lobby code","warning");
      return;
    } 

    try{
      //Fetch lobby details without joining as a player
      const lobbyDetails = await lobbyService.getLobbyDetails(code);
      if (lobbyDetails) {
        setLobby({
          code,
          users: lobbyDetails.users || [],
          colors: lobbyDetails.colors || [],
          shape: lobbyDetails.shape || "",
          teams: lobbyDetails.teams || [],
          game_status: lobbyDetails.game_status || "not_started", 
          time_remaining:60
        });

        //Navigate to lobby screen
        navigate('/lobby', {replace: true})
      }
      else{
        addError("Lobby not found", "error");
      }
    }
    catch(ex){
      addError(ex instanceof Error ? ex.toString() : String(ex), "error");
    }
    
  };

  return (
    <div className="form-container">
      <div className="form-wrapper">
        {/*Welcome message displaying user's call name and role */}
        <h2 className="form-title">
          <span className="tracking-wide">Welcome {user?.callName} ({user?.role})</span>
        </h2>
        <div className="title-accent" />

        {/*Field for entering an existing lobby code*/}
        <div className="input-group">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Lobby Code"
            className="input-field"
          />
        </div>
        
        {/*Button to join an existing lobby*/}
        {user?.role === 'player' && (
          <button onClick={handleJoin} className="submit-button">Join Lobby</button>
        )}
        

        {/*Button for spectators to watch a lobby*/}
        {user && user.role === "spectator" && (
          <button onClick={handleSpectate} className="submit-button">
            Spectate Lobby
          </button>
        )}

        {/*Lobby creation section*/}
        {user && user.role === "player" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="maxPlayers" className="whitespace-nowrap">
                Number of players
              </label>
              <input
                id="maxPlayers"
                type="number"
                min={2}
                step={2}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                placeholder="Max Players (even number)"
                className="input-field"
              />
            </div>
            <button onClick={handleCreate} className="submit-button">
               Create Lobby
            </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default EnterLobby;