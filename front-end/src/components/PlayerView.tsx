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
        const teams = Object.values(lobby.teams);
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
        setStatus("Shot fired");
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
          setStatus(`Game Over: ${msg.payload.winning_team_name}`);
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
      <button
        onClick={shoot}
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "20px 40px",
          fontSize: "22px",
          borderRadius: "50px",
          backgroundColor: crosshairColor === "red" ? "limegreen" : "gray",
          color: "white",
          border: "none",
        }}
      >
        Shoot
      </button>
    </div>
  );
}

export default PlayerView;