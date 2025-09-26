//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

//Define the error object
interface ErrorState {
  id: string;
  message: string;
  type: "error" | "warning" | "info";
  duration?: number;
}

//Define the error context object
interface ErrorContextType {
  errors: ErrorState[];
  addError: (message: string, type?: "error" | "warning" | "info", duration?: number) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

//Create error context to track and share error state
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

//Create error provider component to wrap the error context to the children
export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  //State to store the error messages
  const [errors, setErrors] = useState<ErrorState[]>([]);

  //Method to add an error to the states
  const addError = (message: string, type: "error" | "warning" | "info" = "error", duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);//Generate a random id to the error
    const newError: ErrorState = { id, message, type, duration };
    setErrors(prev => [...prev, newError]);
  };

  //Method to remove an error from the state
  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  //Method to clear all errors from the state
  const clearErrors = () => {
    setErrors([]);
  };

  //Provide error state to and methods to the children through the error context
  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

//Hook to access the error context in components
export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};