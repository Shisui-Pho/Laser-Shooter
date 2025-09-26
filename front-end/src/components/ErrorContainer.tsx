//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

import React from "react";
import { useError } from "../context/ErrorContext";
import ErrorToast from "./Error";
import "./Error.css";

//Component for the error UI
const ErrorContainer: React.FC = () => {
  const { errors, removeError } = useError();

  //If there's no errors, return null
  if (errors.length === 0) return null;

  //Return the error UI
  return (
    <div className="error-container">
      {errors.map((error, index) => (
        <div 
          key={error.id} 
          style={{ 
            position: 'fixed',
            top: `${1 + index * 5}rem`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999 - index
          }}
        >
          <ErrorToast
            message={error.message}
            type={error.type}
            duration={error.duration}
            onClose={() => removeError(error.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default ErrorContainer;