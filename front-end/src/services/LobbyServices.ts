import type { Lobby,User } from "../models/User";

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

//Leave Team response model
interface LeaveTeamResponse{
  message: string;
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
      return null;
    }
  },

  //Get Lobby Details
  async getLobbyDetails(lobbyCode:string):Promise<Lobby|null>{
    try{
      const res=await fetch(`${API}/GetLobbyDetails/${lobbyCode}`);
      return res.ok ? await res.json() : null;
    }catch (e) {
      return null;
    }
  },

  //Leave Team
  leaveTeam: async (lobbyCode: string, user: User): Promise<void> => {
    // Check if the user is authenticated before attempting to leave
    if (!user || !user.id || !user.teamId) {
    }
    
    // Construct the URL for the leave team endpoint
    const url = `${API}/LeaveTeam/${lobbyCode}`;
    
    // Prepare the request body. Send the full user object to match the API's expectation.
    const requestBody = {
      id: user.id,
      name: user.callName,
      team_id: user.teamId,
      hits: user.hits,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Handle the response from the server
      if (!response.ok) {
        const errorData = await response.json();
      }

    } catch (error) {
      throw error;
    }
  },
};