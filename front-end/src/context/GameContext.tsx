//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

import React, { createContext, useContext, useState } from "react";
import type { User, Lobby } from "../models/User.ts";

//Gamestate model
interface GameState {
  user: User | null;//The current user (or null if not set yet)
  lobby: Lobby | null;//The current lobby (or null if not in one)
  setUser: (user: User) => void;//Function to update the user
  setLobby: (lobby: Lobby) => void;//Function to update the lobby
}

//Create Game context that will be filled by Game provider
const GameContext = createContext<GameState | undefined>(undefined);

//Gameprovider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  //Local React state that we want to share globally
  const [user, setUser] = useState<User | null>(null);
  const [lobby, setLobby] = useState<Lobby | null>(null);

  return (
    // The value prop is the "global object" every component can read
    <GameContext.Provider value={{ user, lobby, setUser, setLobby }}>
      {children}
    </GameContext.Provider>
  );
};

//Wrap the Gamecontext in a hook instead of calling it everywhere
export const useGame = (): GameState => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside a GameProvider");
  return ctx;
};
