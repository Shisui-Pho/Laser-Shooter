import React, { useState } from "react";
import { useGame } from "../context/GameContext.tsx";
import type { Role } from "../models/User.ts";
import "../pages/Home/index.css";
import { useError } from "../context/ErrorContext"

interface Props {
  setSubmitted: (submitted:boolean) => void;
}
const EnterCallName: React.FC<Props> = ({setSubmitted}) => {
  //Pull setUser out of global context so we can save what the user typed
  const { setUser } = useGame();
  const { addError } = useError();

  //Local form fields
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("player");

  //Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    try{
      e.preventDefault(); // prevent page refresh
          if(name.trim().length<1){
            addError("Enter a valid name","warning");
            return;
          }

          //Save the new user object into our global context
          //Use a placeholder for both id and callName for now until we get them from the backend
          setUser({ id: -1, callName: name, role });
          setSubmitted(true); //Indicate that it has been submitted
    }
    catch(ex){
      addError(ex instanceof Error ? ex.toString() : String(ex), "error");
    }
    
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form-wrapper">
        <h1 className="form-title">
          <span className="tracking-wide">Access Protocol</span>
        </h1>
        <div className="title-accent" />

        {/*Textbox for the player's name*/}
        <div className="input-group">
          <label htmlFor="name" className="input-label">Enter your name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maverick"
            required
            className="input-field"
          />
        </div>

        {/*Dropdown for selecting player or spectator*/}
        <div className="input-group">
          <label htmlFor="role" className="input-label">Role:</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="select-field">
            <option value="player" className="option-player">Player</option>
            <option value="spectator" className="option-spectator">Spectator</option>
          </select>
        </div>

        {/*Submit button*/}
        <button type="submit" className="submit-button">Enter Arena</button>

      </form>
    </div>
  );
};

export default EnterCallName;