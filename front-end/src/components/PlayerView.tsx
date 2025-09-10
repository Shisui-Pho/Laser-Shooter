import React, { useEffect, useRef, useState } from "react";
import CameraService from "../services/CameraService";
import Crosshair from "../widgets/Crosshair";
import ColorDetectionService, { type DetectedColor } from "../services/ColorDetectionService";
import WebSocketService, { type GameMessage } from "../services/WebSocketService";
import { useGame } from "../context/GameContext";

function PlayerView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [crosshairColor, setCrosshairColor] = useState<DetectedColor>("white");
  const [error, setError] = useState<string | null>(null);

  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("Waiting...");
  const { user, lobby } = useGame();

  // Start camera
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

  // Set my team color in detection service
  useEffect(() => {
  if (!user || !lobby?.code || !user.teamId) return;

  WebSocketService.connect(lobby.code, user.teamId as string, handleGameMessage);

  return () => WebSocketService.disconnect();
}, [user, lobby?.code, user?.teamId]);


  // Color detection loop
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

  // WebSocket connection
  useEffect(() => {
    if (!user || !lobby?.code || !user.teamId) return;
    WebSocketService.connect(lobby.code, user.teamId, handleGameMessage);
    return () => WebSocketService.disconnect();
  }, [user, lobby?.code, user?.teamId]);

  const handleGameMessage = (msg: GameMessage) => {
    console.log("Received message in handleGameMessage:", msg);

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
      default:
        console.warn("Unhandled message type:", msg.type);
    }
  };

  // Shoot button handler
  const shoot = () => {
    if (!videoRef.current || !canvasRef.current || !user) return;
    if (crosshairColor !== "green") {
      setStatus("Can't shoot — no enemy detected");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];

    WebSocketService.sendShot(imageBase64, user, crosshairColor);
    setStatus("Shot fired!");
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
      <canvas ref={canvasRef} width={640} height={480} style={{ display: "none" }} />
      <Crosshair color={crosshairColor} />

      {/* HUD */}
      <div style={{ position: "absolute", top: 10, left: 10, color: "white", background: "rgba(0,0,0,0.5)", padding: "5px", borderRadius: "8px" }}>
        Score: {score}
      </div>
      {timer !== null && (
        <div style={{ position: "absolute", top: 10, right: 10, color: "yellow", background: "rgba(0,0,0,0.5)", padding: "5px", borderRadius: "8px" }}>
          Time: {timer}s
        </div>
      )}
      <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", color: "lime", background: "rgba(0,0,0,0.5)", padding: "5px", borderRadius: "8px" }}>
        {status}
      </div>

      {/* 🔘 Shoot button */}
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
          backgroundColor: crosshairColor === "green" ? "limegreen" : "gray",
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
