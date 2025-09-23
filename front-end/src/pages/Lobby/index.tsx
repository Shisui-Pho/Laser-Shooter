import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import type { Lobby, Team } from "../../models/User.ts";
import { lobbyService } from "../../services/LobbyServices.ts";
import WebSocketService from "../../services/WebSocketService.ts";
import type { GameMessage } from "../../services/WebSocketService.ts";
import { useNavigate } from 'react-router-dom';
import styles from './index.module.css'
import GameOver from "../../components/GameOver.tsx";
import { useError } from "../../context/ErrorContext";

//TODO: Add styling to page
const Index: React.FC = () => {
  //
  const { lobby, user } = useGame();
  const [lobbyDetails, setLobbyDetails] = useState<Lobby | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addError } = useError();
  const navigate = useNavigate();

  const fetchLobbyDetails = async (lobbyCode: string) => {
    const details = await lobbyService.getLobbyDetails(lobbyCode);
    if (details){
      //console.log(details);
      setLobbyDetails(details);
    } 
  };

  //Scroll to bottom of messages whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  //TODO: Break this hook into spectator and player hook to avoid those nasty if statements
  useEffect(() => {
    if(!user)return;
    if (user.role === "player" && (!user?.teamId || !lobby?.code)) {
      addError("WS not connecting yet, missing teamId or lobby code","error");
      return;
    }

    if (!lobby?.code){
      addError("No lobby code provided","error");
      return;
    } 
    fetchLobbyDetails(lobby.code);
    
    //Only players can connect to the websockets
    if(!WebSocketService.isConnected() && user.role === 'player' && user.teamId)
    {
      //Open new connection when not connected
      WebSocketService.connect(lobby?.code, user.teamId, user.id, handleGameMessage);
    }

    //poll the data periodically for spactators
    if(user.role === 'spectator'){
      const interval = setInterval(() => {
        fetchLobbyDetails(lobby.code!) 
      }, 2000);

      //if the game has ended, stop the polling
      if(lobbyDetails?.game_status === "game_over"){
        clearInterval(interval);
      }
      
      return () => clearInterval(interval);
    }
    //FIXME: Lobby.code, user.teamId, user.id do not change once the player has been added
    //- do we really need to keep track of this?    
  }, [lobby?.code, user?.teamId, user?.id]);

  const handleGameMessage = (msg: GameMessage) => {
    //Handle different message types
    switch (msg.type) {
      case 'start_game':
        //console.log("Start game received, would redirect now");
        //Redirect to player scree page
        //-They cannot go back to previous page
        navigate('/player', {replace: true})
        break;
      case 'join':
        //Add join message to the messages list
        setMessages(prev => [...prev, msg]);
        if(lobby?.code) //Only poll data when someone was added
          fetchLobbyDetails(lobby.code)
        break;
      default:
        //For other message types, just add to messages
        //-This is just incase, but the only messages to be recieved at this stage are for "join" and "start_game"
        setMessages(prev => [...prev, msg]);
        break;
    }
  };

  //Format message for display based on type
  const formatMessage = (msg: GameMessage): string => {
    switch (msg.type) {
      case 'join':
        return `${msg.payload.user_name} joined team ${msg.payload.team_name}`;
      default:
        return `System message: ${msg.type}`;
    }
  };
  function handleRejoinLobby(){
    //Navigate the user back to the home screen
    navigate('/', {replace:true});
  }
  
  const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

if (!lobbyDetails) {
  return (
    <div className={""}>
      <div className={""}></div>
      <div className={styles.loadingContent}>
        <h2 className={styles.loadingTitle}>CONNECTING TO ARENA...</h2>
        <p className={styles.loadingText}>Initializing combat systems</p>
      </div>
      <p className="mt-1">
          <button className={styles.submitButton} onClick={handleRejoinLobby}>Rejoin lobby</button>
        </p>
    </div>
  );
}

// if(lobbyDetails.game_status === 'game_over'){
//   return (
//     <>
//     </>
//   )
// }
const isSpectator = user?.role === 'spectator';

return (
  <div className={`${""} ${isSpectator ? styles.spectatorView : ''}`}>
    {/* <div className={""}></div> */}
    
    {isSpectator && (
      <div className={styles.spectatorBadge}>SPECTATOR MODE</div>
    )}

    {/* Header Section */}
    <div className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <div>
          <h1 className={styles.headerTitle}>LASER SHOOTER LOBBY</h1>
          <p className={styles.headerSubtitle}>
            {isSpectator ? 'OBSERVER PROTOCOL ACTIVE' : 'AWAITING COMBATANTS'}
          </p>
        </div>
        <div className={styles.lobbyCodeContainer}>
          <div className={styles.lobbyCodeLabel}>LOBBY CODE</div>
          <div className={styles.lobbyCodeDisplay}>
            {lobby?.code}
          </div>
        </div>
      </div>
      
      <div className={styles.statusContainer}>
        <div className={`${styles.statusIndicator} ${styles[lobbyDetails.game_status]}`}></div>
        <span className={styles.statusText}>
          SYSTEM STATUS: {lobbyDetails.game_status.toUpperCase()}
        </span>
        <button 
          onClick={handleRejoinLobby}
          className={styles.rejoinLobby}
        >
          REJOIN
        </button>
      </div>
      {/* Time Remaining Section */}
      {lobbyDetails.time_remaining && (
        <div className={styles.timeContainer}>
          <div className={styles.timeLabel}>MISSION TIME REMAINING</div>
          <div className={styles.timeDisplay}>
            {formatTime(lobbyDetails.time_remaining)}
          </div>
        </div>
      )}


    </div>

    <div className={styles.gridContainer}>
      {/* Teams Section */}
      <div className={styles.teamsContainer}>
        {lobbyDetails.teams.map((team: Team, idx: number) => (
          <div key={team.id} className={styles.teamCard}>
            <div className={styles.teamHeader}>
              <h3 className={styles.teamTitle}>
                SQUAD {team.color.toUpperCase()} • {team.shape}
              </h3>
              <div className={styles.teamPlayerCount}>
                {team.players?.length || 0}/{team.max_players}
              </div>
            </div>
            
            <div className={styles.teamScoreContainer}>
              <div className={styles.teamScore}>POWER: {team.score ?? 0}</div>
              <div className={styles.teamNeeds}>
                REQUIRES: {team.max_players - (team.players?.length || 0)}
              </div>
            </div>
            
            <div className={styles.playersContainer}>
              <h4 className={styles.playersTitle}>COMBAT ROSTER</h4>
              <div className={styles.playersList}>
                {(team.players ?? []).map((player: any) => (
                  <div key={player.id} className={styles.playerItem}>
                    <div className={styles.playerIndicator}></div>
                    <div>
                      <div className={styles.playerName}>{player.name}</div>
                      <div className={styles.playerId}>ID: {player.id}</div>
                    </div>
                  </div>
                ))}
                {(!team.players || team.players.length === 0) && (
                  <div className={styles.emptyPlayers}>AWAITING COMBATANTS</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Messages Section - Only for players */}
      {!isSpectator && (
        <div className={styles.messagesContainer}>
          <div className={styles.messagesHeader}>
            <h3 className={styles.messagesTitle}>COMMS CHANNEL</h3>
          </div>
          
          <div className={styles.messagesContent}>
            {messages.length === 0 ? (
              <div className={styles.emptyMessages}>
                <p>COMMUNICATIONS ONLINE</p>
                <p className="text-sm mt-2">Awaiting transmission...</p>
              </div>
            ) : (
              <div>
                {messages.map((msg, index) => (
                  <div key={index} className={styles.messageItem}>
                    <div className={styles.messageContent}>
                      <div>{formatMessage(msg)}</div>
                      <div className={styles.messageTime}>[{new Date().toLocaleTimeString()}]</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <div className={styles.messagesFooter}>
            <div className={styles.footerText}>
              LASER_SHOOTER_PROTOCOL • {lobbyDetails.teams.reduce((acc, team) => acc + (team.players?.length || 0), 0)} COMBATANTS ONLINE
            </div>
          </div>
        </div>
      )}
    </div>
      
    {/* Game Over Overlay for Spectators */}
    {lobbyDetails.game_status === "game_over" && isSpectator && (
      <GameOver 
        lobbyDetails={lobbyDetails} user={null}
      />
    )}

    {/* Game Start Overlay */}
    {lobbyDetails.game_status === "starting" && (
      <div className={styles.gameStartOverlay}>
        <div className={styles.gameStartContent}>
          <h2 className={styles.gameStartTitle}>ENGAGEMENT IMMINENT!</h2>
          <p className={styles.gameStartText}>Prepare for combat sequence</p>
        </div>
      </div>
    )}
  </div>
);
}
export default Index;