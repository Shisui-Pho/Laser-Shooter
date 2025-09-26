//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

import React, { useEffect, useState } from "react";

interface ErrorToastProps {
  message: string;
  type?: "error" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
}

//Component displaying error alerts
const ErrorToast: React.FC<ErrorToastProps> = ({ 
  message, 
  type = "error", 
  duration = 5000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case "warning":
        return "";
      case "info":
        return "";
      case "error":
      default:
        return "";
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "warning":
        return "border-yellow-500";
      case "info":
        return "border-green-500";
      case "error":
      default:
        return "border-red-500";
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`
        min-w-80 max-w-md rounded-lg border-2 bg-zinc-900 p-4 
        backdrop-blur-sm transition-all duration-300
        ${getBorderColor()} 
        ${isExiting ? "error-toast-exit" : "error-toast-enter"}
      `}
      style={{
        animation: type === "error" ? "pulse-glow-red 0.5s infinite alternate" : 
                  type === "warning" ? "pulse-glow-yellow 0.5s infinite alternate" :
                  "pulse-glow-green 0.5s infinite alternate"
      }}
    >
      <div className="error-toast-content">
        <span className="error-icon">{getIcon()}</span>
        <span className="error-message">{message}</span>
        {/*<button 
          onClick={handleClose}
          className="error-close-button"
          aria-label="Close error message"
        >
          X
        </button>*/}
      </div>
    </div>
  );
};

export default ErrorToast;