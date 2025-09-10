import React, { useEffect, useRef, useState } from "react";
import CameraService from "../services/CameraService";
import Crosshair from "../widgets/Crosshair";
import ColorDetectionService from "../services/ColorDetectionService";
import type { DetectedColor } from "../services/ColorDetectionService";
import WebSocketService, { type GameMessage } from "../services/WebSocketService";
import { useGame } from "../context/GameContext";

function PlayerView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [crosshairColor, setCrosshairColor] = useState<DetectedColor>("white");
  const [error, setError] = useState<string | null>(null);

  // Game state
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
    return () => {
      CameraService.stopCamera();
    };
  }, []);

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

    return () => {
      WebSocketService.disconnect();
    };
  }, [user, lobby?.code, user?.teamId]);

  // Handle messages from server
  // inside PlayerView.tsx (replace existing handleGameMessage)
const handleGameMessage = (msg: GameMessage) => {
  console.log("Received message in handleGameMessage:", msg);

  switch (msg.type) {
    case "hit":
      setScore((s) => s + 15);
      setStatus("Hit");
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
        setStatus(`Game Over. Winner: ${msg.payload.winning_team_name}`);
      }
      break;

    case "start_game":
      setStatus("Game Started");
      break;

    case "join":
      if (msg.payload) {
        setStatus(`${msg.payload.team_name}: ${msg.payload.members_remaining} slots left`);
      }
      break;

    default:
      console.warn("Unhandled message type:", msg.type, msg);
  }
};




  // Handle shooting
  const shoot = () => {
    if (!videoRef.current || !canvasRef.current || !user) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw current frame from video to canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];

    // Send the frame + player info + detected color
    WebSocketService.sendShot(imageBase64, user, crosshairColor);
  };

  // Shoot when user presses spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        shoot();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [crosshairColor, user]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
      <canvas ref={canvasRef} width={640} height={480} style={{ display: "none" }} />
      <Crosshair color={crosshairColor} />

      {/* Overlay HUD */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "white",
          fontSize: "20px",
          background: "rgba(0,0,0,0.5)",
          padding: "5px 10px",
          borderRadius: "8px",
        }}
      >
        Score: {score}
      </div>
      {timer !== null && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "yellow",
            fontSize: "20px",
            background: "rgba(0,0,0,0.5)",
            padding: "5px 10px",
            borderRadius: "8px",
          }}
        >
          Time: {timer}s
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          color: "lime",
          fontSize: "18px",
          background: "rgba(0,0,0,0.5)",
          padding: "5px 10px",
          borderRadius: "8px",
        }}
      >
        {status}
      </div>
    </div>
  );
}

export default PlayerView;