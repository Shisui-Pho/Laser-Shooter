import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import type { Lobby } from "../models/User.ts";
import { lobbyService } from "../services/LobbyServices.ts";

//Component to display lobby details and team information
//Renamed from "Lobby" to "LobbyDisplay" to avoid import conflict with Lobby model type
const LobbyDisplay: React.FC = () => {
  //Access lobby state from game context
  const { lobby } = useGame();
  
  //Local state to store fetched lobby details
  const [lobbyDetails, setLobbyDetails] = useState<Lobby | null>(null);

  //Function to fetch lobby details from the backend API
  const fetchLobbyDetails = async (lobbyCode: string) => {
    //Call service to get lobby details
    const details = await lobbyService.getLobbyDetails(lobbyCode);
    //Update state if details were successfully retrieved
    if (details) setLobbyDetails(details);
  };

  //Effect hook to handle polling of lobby details
  useEffect(() => {
    //Exit lobby if no lobby code is available
    if (!lobby?.code) return;

    //Initial Lobby details fetch
    fetchLobbyDetails(lobby.code);
    
    //Poll lobby details every 2 seconds
    const interval = setInterval(() => fetchLobbyDetails(lobby.code!), 2000);
    
    //Destroy the timer when the component unmounts
    return () => clearInterval(interval);
  }, [lobby?.code]); // Only re-run effect if lobby code changes

  //Display waiting for lobby details if we have't recieved them
  if (!lobbyDetails) {
    return <div>Waiting for lobby details...</div>;
  }

  //Main component showing lobby teams and players
  return (
    <div>
      <h2>Lobby Code: {lobbyDetails.code}</h2>

      {/*Display teams*/}
      {Array.isArray(lobbyDetails.teams) ? (
        //Old backend data structure
        <div>
          <h3>Teams</h3>
          <ul>
            {(lobbyDetails.teams ?? []).map((teamId) => (
              <li key={teamId}>{teamId}</li>
            ))}
          </ul>
        </div>
      ) : (
        //New backend data structure
        <>
          <h3>Lobby Status: {lobbyDetails.teams.game_status}</h3>
          {Object.values(lobbyDetails.teams.teams ?? {}).map((team: any) => (
            <div key={team.id} style={{ marginBottom: "20px" }}>
              {/* Display team header with ID, color and shape */}
              <h4>
                {team.id} ({team.color} {team.shape})
              </h4>

              {/* Display team score */}
              <p>
                <strong>Team Score:</strong> {team.score ?? 0}
              </p>

              {/*Table to display players in the team*/}
              <table border={1} cellPadding={5}>
                <thead>
                  <tr>
                    <th>Player ID</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {/*Map through each player in the team*/}
                  {(team.players ?? []).map((player: any) => (
                    <tr key={player.id}>
                      <td>{player.id}</td>
                      <td>{player.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/*Display player count for the team*/}
              <p>
                {(team.players?.length ?? 0)}/{team.max_players} players
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default LobbyDisplay;
