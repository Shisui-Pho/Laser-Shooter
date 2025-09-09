import type { Lobby, } from "../models/User";

//We will have our api here, right now local host for testing
const API="http://127.0.0.1:8000";

//Join Lobby repsonse model
interface JoinLobbyResponse{
  message:string;
  user:{
    id:number;
    name:string;
    team_id:string;
    hits:number;
  };
}

//Create Lobby response model
interface CreateLobbyResponse{
  lobby_code:string;
  colors:string[];
  shape:string;
  teams:any[];
}


export const lobbyService={

  //Create Lobby
  async createLobby(maxPlayers:number):Promise<CreateLobbyResponse|null>{
    try {
      const res=await fetch(`${API}/CreateLobby/${maxPlayers}`,{
        method:"POST",
      });
      return res.ok ? await res.json():null;
    } catch (e) {
      console.error("Failed to create lobby: ",e);
      return null;
    }
  },

  //Join Lobby
  async joinLobby(code:string,callName:string):Promise<JoinLobbyResponse|null>{
    try {
      const res=await fetch(`${API}/JoinLobby/${code}/${callName}`,{
        method: "POST",
      });
      return res.ok ? await res.json():null;
    } catch(e){
      console.error("Failed to join lobby: ",e);
      return null;
    }
  },

  //Get Lobby Details
  async getLobbyDetails(lobbyCode:string):Promise<Lobby|null>{
    try{
      const res=await fetch(`${API}/GetLobbyDetails/${lobbyCode}`);
      return res.ok ? await res.json() : null;
    }catch (e) {
      console.error("Failed to fetch lobby details: ",e);
      return null;
    }
  },

};