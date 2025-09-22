//This file will be modularized once mvp is complete

export type Role = "player" | "spectator";

//User model
export interface User {
  id: number;          
  callName: string;    
  role: Role;          
  teamId?: string;  
  hits?: number;       
}

//Team model
export interface Team {
  id: string;
  score?: number;
  color: string;
  shape?: string;
  hits: number;
  misses: number;
  shots: number;
  players: User[];
  max_players: number;
}

// Lobby model
export interface Lobby {
  code: string;
  users: User[];
  colors: string[];
  shape: string;
  teams: Team[];
  game_status: string;
  time_remaining: number;
}