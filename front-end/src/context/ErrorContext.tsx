import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
interface ErrorState {
  id: string;
  message: string;
  type: "error" | "warning" | "info";
  duration?: number;
}

interface ErrorContextType {
  errors: ErrorState[];
  addError: (message: string, type?: "error" | "warning" | "info", duration?: number) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorState[]>([]);

  const addError = (message: string, type: "error" | "warning" | "info" = "error", duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newError: ErrorState = { id, message, type, duration };
    setErrors(prev => [...prev, newError]);
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};