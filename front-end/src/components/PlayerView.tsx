import React, { useEffect, useRef, useState } from "react";
import CameraService from "../services/CameraService";
import Crosshair from "../widgets/Crosshair";
import ColorDetectionService, { type DetectedColor } from "../services/ColorDetectionService";
import WebSocketService, { type GameMessage } from "../services/WebSocketService";
import { useGame } from "../context/GameContext";
import type { Team } from "../models/User";


//This code is temporary and just for the MVP, will be cleaned & modularized once after MVP fully works
function PlayerView() {
  //Video and canvas refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  //States
  const [crosshairColor, setCrosshairColor] = useState<DetectedColor>("white");
  const [shootColor, setShootColor] = useState<string>(""); // Properly typed state
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("Waiting...");
  const [enemyScore, setEnemyScore]= useState(0);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [reloadProgress, setReloadProgress] = useState<number>(0);
  
  //Access user and lobby form the game context
  const { user, lobby } = useGame();

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
      console.log("WS not connecting yet, missing teamId or lobby code", {
        teamId: user?.teamId,
        lobbyCode: lobby?.code,
      });
      return;
    }

    //Logs for debugging
    console.log("Connecting to WebSocket with:", lobby.code, user.teamId);
    console.log("Raw lobby object:", lobby);

    //Intialize vairabe for each team
    let myTeam: Team | undefined;
    let enemyTeam: Team | undefined;

    //Determine team information using the lobby structure
    if (lobby.teams) {
      //Handle array based team data
      if (Array.isArray(lobby.teams)) {
        if (Array.isArray(lobby.colors) && lobby.teams.length === lobby.colors.length) {
          const teams = lobby.teams.map((id, idx) => ({
            id,
            color: lobby.colors[idx],
            shape: lobby.shape ?? null,
          })) as Team[];

          myTeam = teams.find((t) => t.id === user.teamId);
          enemyTeam = teams.find((t) => t.id !== user.teamId);
        } else {
          console.log("Mismatch between lobby.teams and lobby.colors", {
            teams: lobby.teams,
            colors: lobby.colors,
          });
        }
      }
      //Handle object based team data
      else {
        const teamsObj = (lobby.teams as { teams: Record<string, Team> }).teams;
        const teams: Team[] = Object.values(teamsObj);

        myTeam = teams.find((t) => t.id === user.teamId);
        enemyTeam = teams.find((t) => t.id !== user.teamId);
      }
    }

    //Configure color detection with team colors
    if (myTeam && enemyTeam) {
      ColorDetectionService.setTeamColors(myTeam.color, enemyTeam.color);
      setShootColor(enemyTeam.color);
      console.log("PlayerView team colors resolved:", {
        myTeamColor: myTeam.color,
        enemyTeamColor: enemyTeam.color,
      });
    } else {
      console.warn("Could not resolve team colors, fallback to default", {
        myTeam,
        enemyTeam,
        lobby,
      });
    }

    //Establish a websocket connection using the websocket service
    WebSocketService.connect(lobby.code, user.teamId, handleGameMessage);

    //Disconnect websocket when component unmounts
    return () => {
      console.log("Disconnecting WebSocket");
      WebSocketService.disconnect();
    };
  }, [user?.teamId, lobby?.code, lobby?.teams, lobby?.colors, lobby?.shape]);

  //Handle messages from websocket
  const handleGameMessage = (msg: GameMessage) => {
    console.log("Received message:", msg);

    switch (msg.type) {
      case "hit":
        setScore((s) => s + 15);
        setStatus("Hit!");
        break;
      case "shot":
        setEnemyScore((s)=> s + 15);
        setStatus("Got hit");
        break;
      case "missed_shot":
        setStatus("Missed");
        break;
      case "timer_report":
        if (msg.payload?.time_remaining !== undefined) {
          setTimer(Math.floor(msg.payload.time_remaining));
        }
        break;
      case "game_over":
        if (msg.payload?.winning_team_name) {
          setStatus(`Game Over!\nWinner: ${msg.payload.winning_team_name}`);
        }
        break;
      case "start_game":
        setStatus("Game Started!");
        break;
      case "join":
        if (msg.payload) {
          setStatus(`${msg.payload.team_name}: ${msg.payload.members_remaining} slots left`);
        }
        break;
      default:
        console.warn("Unhandled message type:", msg.type);
    }
  };

  //Shoot button handler
  const shoot = () => {
    //Return if any required of elements is null
    if (!videoRef.current || !canvasRef.current || !user) return;

    //Disable button and start reloading
    setIsReloading(true);
    setStatus("Reloading...");
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
      setStatus("Error: Enemy color not defined");
      return;
    }

    //Send a shot to the server via the websocket service
    WebSocketService.sendShot(imageBase64, user, shootColor);
    setStatus("Shot fired!");
    //Print The base64, for debugging
    console.log("Base 64 data: "+imageBase64)
  };

  return (
    //Styling here is temporary for testing and development
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* Video feed */}
      <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
      <canvas ref={canvasRef} width={640} height={480} style={{ display: "none" }} />

      {/* Crosshair overlay */}
      <Crosshair color={crosshairColor} />

      {/* HUD - Score */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "white",
          background: "rgba(0,0,0,0.5)",
          padding: "5px",
          borderRadius: "8px",
        }}
      >
        Score: {score}
      </div>

      <div
        style={{
          position: "absolute",
          top: 60,
          left: 10,
          color: "white",
          background: "rgba(0,0,0,0.5)",
          padding: "5px",
          borderRadius: "8px",
        }}
      >
        Enemy Score: {enemyScore}
      </div>

      {/* HUD - Timer */}
      {timer !== null && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "yellow",
            background: "rgba(0,0,0,0.5)",
            padding: "5px",
            borderRadius: "8px",
          }}
        >
          Time: {timer}s
        </div>
      )}

      {/* HUD - Status */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          color: "lime",
          background: "rgba(0,0,0,0.5)",
          padding: "5px",
          borderRadius: "8px",
        }}
      >
        {status}
      </div>

      {/* Shoot button */}
      <div style={{ 
        position: "absolute", 
        bottom: 20, 
        left: "50%", 
        transform: "translateX(-50%)",
        width: 80,
        height: 80
      }}>
        <button
          onClick={shoot}
          disabled={isReloading}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: isReloading ? "gray" : "red",
            color: "white",
            border: "none",
            fontSize: "22px",
            cursor: isReloading ? "not-allowed" : "pointer",
            position: "relative",
            overflow: "hidden"
          }}
        >
          Shoot
          {isReloading && (
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                transform: "rotate(-90deg)",
              }}
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
    </div>
  );
}

export default PlayerView;