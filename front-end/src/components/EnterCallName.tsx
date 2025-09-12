import React, { useState } from "react";
import { useGame } from "../context/GameContext.tsx";
import type { Role } from "../models/User.ts";

const EnterCallName: React.FC = () => {
  //Pull setUser out of global context so we can save what the user typed
  const { setUser } = useGame();

  //Local form fields
  const [name, setName] = useState("");         
  const [role, setRole] = useState<Role>("player"); 

  //Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // prevent page refresh

    //Save the new user object into our global context
    //Use a placeholder for both id and callName for now until we get them from the backend
    setUser({ id: -1, callName: name, role });

    console.log("User created:", name, role);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/*Textbox for the player's name*/}
      <label>Enter your name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Galane"
        required
      />

      {/*Dropdown for selecting player or spectator*/}
      <label>Role:</label>
      <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
        <option value="player">Player</option>
        <option value="spectator">Spectator</option>
      </select>

      {/*Submit button*/}
      <button type="submit">Enter Arena</button>
    </form>
  );
};

export default EnterCallName;