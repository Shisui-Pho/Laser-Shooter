export type Role = "player" | "spectator";

// Frontend User model (mapped from backend Player)
export interface User {
  id: string;          // Backend generates numeric ID
  callName: string;    // Local alias for backend "name"
  role: Role;          // Player or spectator
  teamId?: string;     // Backend assigns team_id after joining
  hits?: number;       // Track hits (backend returns this)
}

// Lobby model
export interface Lobby {
  code: string;        // Lobby code (backend lobby_code)
  users: User[];       // Users in lobby (frontend tracking)
  colors: string[];    // Colors assigned by backend
  shape: string;       // Shape assigned by backend
  teams: string[];     // Team names (Team_Red_Square, etc.)
}
