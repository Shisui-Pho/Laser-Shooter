//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

import { useEffect, useRef, useState } from "react";
import CameraService from "../../services/CameraService";
import Crosshair from "../../widgets/Crosshair";
import ColorDetectionService, { type DetectedColor } from "../../services/ColorDetectionService";
import WebSocketService, { type GameMessage } from "../../services/WebSocketService";
import { useGame } from "../../context/GameContext";
import type { Lobby, Team } from "../../models/User";
import { useNavigate } from "react-router-dom";
import "./index.css";
import { lobbyService } from "../../services/LobbyServices";
import GameOver from "../../components/GameOver";
import { useError } from "../../context/ErrorContext";


function Index() {
  //Video and canvas refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  //States
  const [crosshairColor, setCrosshairColor] = useState<DetectedColor>("white");
  const [shootColor, setShootColor] = useState<string>(""); // Properly typed state
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [enemyScore, setEnemyScore]= useState(0);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [reloadProgress, setReloadProgress] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const { addError } = useError();

  // Reference for the status message timeout
  const statusTimeoutRef = useRef<number | null>(null);
  
  //Access user and lobby form the game context
  const { user, lobby } = useGame();
  const navigate = useNavigate();

  //Helper function to set and clear the status message
  const updateStatus = (message: string) => {
   if (statusTimeoutRef.current) {
    clearTimeout(statusTimeoutRef.current);
   }
   setStatus(message);
   if (message !== `Game Over!`) {
    statusTimeoutRef.current = setTimeout(() => {
     setStatus("");
    }, 4000);
   }
   else{
    statusTimeoutRef.current = setTimeout(() => {
     setStatus("");
    }, 3000);
   }
  };


  //Start camera
  useEffect(() => {
   if (videoRef.current) {
    try {
     CameraService.startCamera(videoRef.current);
    } catch (err) {
     setError("Unable to start camera: " + err);
    }
   }
   return () => CameraService.stopCamera();
  }, []);

  //Color detection loop
  useEffect(() => {
   const detectLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
     const color = ColorDetectionService.detectColor(video, canvas);
     setCrosshairColor(color);
    }
    requestAnimationFrame(detectLoop);
   };
   requestAnimationFrame(detectLoop);
  }, []);

  //Setup WebSocket and resolve team colors
  useEffect(() => {
   //Return if the team id or lobby code is missing
   if (!user?.teamId || !lobby?.code) {
    addError("WS not connecting yet, missing teamId or lobby code","error");
    return;
   }


   //Intialize vairabe for each team
   let myTeam: Team | undefined;
   let enemyTeam: Team | undefined;

   //TODO: Refine this since the Lobby structure was changed
   //Determine team information using the lobby structure
   if (lobby.teams) {
    //Handle array based team data
    if (Array.isArray(lobby.teams)) {
     if (Array.isArray(lobby.colors) && lobby.teams.length === lobby.colors.length) {
      // const teams = lobby.teams.map((id, idx) => ({
      //  id,
      //  color: lobby.colors[idx],
      //  shape: lobby.shape ?? null,
      // })) as Team[];

      const teams = lobby.teams;
      myTeam = teams.find((t) => t.id === user.teamId);
      enemyTeam = teams.find((t) => t.id !== user.teamId);
     } else {
      addError("Mismatch between lobby.teams and lobby.colors","error");
     }
    }
    //Handle object based team data
    else {
     //const teamsObj = (lobby.teams as { teams: Record<string, Team> }).teams;
     const teams: Team[] = lobby.teams; //Object.values(teamsObj);

     myTeam = teams.find((t) => t.id === user.teamId);
     enemyTeam = teams.find((t) => t.id !== user.teamId);
    }
   }

   //Configure color detection with team colors
   if (myTeam && enemyTeam) {
    ColorDetectionService.setTeamColors(myTeam.color, enemyTeam.color);
    setShootColor(enemyTeam.color);
   } else {
    
   }

   //Establish a websocket connection using the websocket service
   //WebSocketService.connect(lobby.code, user.teamId, handleGameMessage);
   WebSocketService.chageMessageHandler(handleGameMessage);

   //Disconnect websocket when component unmounts
   // return () => {
   //  console.log("Disconnecting WebSocket");
   //  WebSocketService.disconnect();
   // };
  }, [user?.teamId, lobby?.code, lobby?.teams, lobby?.colors, lobby?.shape]);

  //Handle messages from websocket
  let lobbyDetails: Lobby | null = lobby;
  async function handleGameMessage (msg: GameMessage) {

   switch (msg.type) {
    case "hit":
     setScore((s) => s + 15);
     updateStatus("Hit!");
     break;
    case "shot":
     setEnemyScore((s)=> s + 15);
     updateStatus("Got hit");
     break;
    case "missed_shot":
     updateStatus("Missed");
     break;
    case "timer_report":
     if (msg.payload?.time_remaining !== undefined) {
      setTimer(Math.floor(msg.payload.time_remaining));
     }
     break;
    case "game_over":
     if (msg.payload?.winning_team_name) {
      updateStatus(`Game Over!\nWinner: ${msg.payload.winning_team_name}`);
      setIsGameOver(true);
      if(lobby){
        lobbyDetails = await lobbyService.getLobbyDetails(lobby?.code)
      }
     }
     setIsGameOver(true);
     break;
    case "start_game":
     updateStatus("Game Started!");
     break;
    case "join":
     if (msg.payload) {
      updateStatus(`${msg.payload.team_name}: ${msg.payload.members_remaining} slots left`);
     }
     break;
    default:
   }
  };

  const returnToLobby = async () => {
   if (!lobby || !user) return;
   try {
    await lobbyService.leaveTeam(lobby.code, user);
    navigate("/enterLobby");
   } catch (e) {
    navigate("/", {replace:true});//We don't want the user to be able to go back
   }
  };

  //Handle button clicks conditionally
  const handleButtonClick = () => {
   if (isGameOver) {
    returnToLobby();
   } else {
    shoot();
   }
  };


  //Shoot button handler
  const shoot = () => {
   //Return if any required of elements is null
   if (!videoRef.current || !canvasRef.current || !user) return;

   //Disable button and start reloading
   setIsReloading(true);
   updateStatus("Reloading...");
   setReloadProgress(0);

   //Simulate reload progress
   const startTime = Date.now();
   const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / 1000) * 100, 100);
    setReloadProgress(progress);
    if (progress >= 100) {
     clearInterval(interval);
     setIsReloading(false);
    }
   }, 50);

   //Disabled crosshair color from stopping shots(temporary thing to make life easier when debugging)
   /*if (crosshairColor !== "red") {
    setStatus("Can't shoot — no enemy detected");
    return;
   }*/

   //Get current frame and make it a base64 image
   const canvas = canvasRef.current;
   const ctx = canvas.getContext("2d");
   if (!ctx) return;
   ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
   const imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];

   //Validate that enemy color is defined before shooting
   if (!shootColor) {
    updateStatus("Error: Enemy color not defined");
    return;
   }

   //Send a shot to the server via the websocket service
   WebSocketService.sendShot(imageBase64, user, shootColor);
   updateStatus("Shot fired!");
  };

  return (
   //Styling here is temporary for testing and development
   <div className="game-container">
    {error && <div className="error-message">{error}</div>}

    {/* Video feed */}
    <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
    <canvas ref={canvasRef} width={640} height={480} className="hidden-canvas" />

    {/* Crosshair overlay */}
    <Crosshair color={crosshairColor} />

    {/* HUD - Score */}
    <div className="hud-container top-left">
     Score: {score}
    </div>

    <div className="hud-container top-left mt-12 text-neon-red-400">
     <span className="text-neon-red-400">Enemy Score: {enemyScore}</span>
    </div>

    {/* HUD - Timer */}
    {timer !== null && (
     <div className="hud-container top-right text-neon-red-400">
      Time: {timer}s
     </div>
    )}

    {/* HUD - Status */}
    {status && (
     <div className="hud-container top-center">
      {status}
     </div>
    )}

    {/* Shoot button */}
    <div className="shoot-button-container">
     <button
      onClick={handleButtonClick}
      disabled={isReloading && !isGameOver}
      className={`shoot-button ${isReloading ? 'reloading' : ''}`}
     >
      {isGameOver ? "Lobby" : "Shoot"}
      {!isGameOver && isReloading && (
       <svg
        className="reload-svg"
        viewBox="0 0 100 100"
       >
        <circle
         cx="50"
         cy="50"
         r="45"
         fill="none"
         stroke="#ffffff"
         strokeWidth="10"
         strokeDasharray="283"
         strokeDashoffset={283 * (1 - reloadProgress / 100)}
        />
       </svg>
      )}
     </button>
    </div>
     {/* Game Over Overlay for Spectators */}
    {isGameOver && lobbyDetails && (
      <GameOver 
        lobbyDetails={lobbyDetails} user={user}
      />
    )}
   </div>
  );
}
export default Index;