from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from ComputerVisionModel import ComputerVisionModel
import services.service as sv
from models import Player,Team
from ConnectionManager import ConnectionManager
app = FastAPI()

#CORS configuration: allow requests from any origin (temp for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],#TODO: Change this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vision_model = ComputerVisionModel()
c_manager = ConnectionManager()

# lobbydetails[lobby_code][team_name]] = Team object
#-I put team name as key to make it easier to look up teams when sending messages
#TODO: Make use of a class to manage lobbies instead of a dict
lobbies: dict[str, dict[str, Team]] = {}
id_counter : int = 0


@app.get("/")
async def root():
    return {"message": "Phiwo and Galane were here!"}


#Get methods for api endpoints
@app.post("/CreateLobby/{max_players}")
async def create_lobby(max_players: int):
    if max_players % 2 != 0 or max_players < 2:
        raise HTTPException(status_code=400, detail="max_players must be an even number greater than or equal to 2.")
    
    #create a new lobby code
    lobby_code = sv.generate_lobby_code(list(lobbies.keys()))

    #create two teams with random color/shape combinations
    teamA, teamB = sv.create_teams(lobbies)
    teamA.max_players = max_players // 2
    teamB.max_players = max_players // 2

    lobbies[lobby_code] = {teamA.id : teamA, teamB.id : teamB}
    
    #Colors are different for each team, but shape is the same
    colors = [teamA.color, teamB.color]
    shape = teamA.shape

    return {
        "lobby_code": lobby_code,
        "colors": colors,
        "shape": shape, 
        "teams": [teamA.id, teamB.id]
        }


@app.post("/JoinLobby/{lobby_code}/{username}")
async def join_lobby(lobby_code: str, username: str):
    global id_counter
    if not lobbies.get(lobby_code):
        raise HTTPException(status_code=404, detail="Lobby not found.")
    
    player = Player(id=id_counter, name=username, team_id="", hits=0)
    id_counter += 1
    #Assign the player to a team randomly(well, not really randomly, but balancing the teams)
    assign_team(lobby_code, player)
    return {"message": f"Joined lobby {lobby_code}","user": player}


@app.get("/GetLobbyDetails/{lobby_code}")
async def get_lobby_details(lobby_code: str):
    if not lobbies.get(lobby_code):
        raise HTTPException(status_code=404, detail="Lobby not found.")
    
    return {"teams": list(lobbies[lobby_code].values())}

    
@app.post("/LeaveTeam/{lobby_code}")
async def leave_team(lobby_code: str, player: Player):
    if not lobbies.get(lobby_code):
        raise HTTPException(status_code=404, detail="Lobby not found.")
    
    if not lobbies[lobby_code].get(player.team_id):
        raise HTTPException(status_code=404, detail="Team not found in this lobby.")

    if player not in lobbies[lobby_code][player.team_id].players:
        raise HTTPException(status_code=404, detail="Player not found in this team.")
    
    #remove th eplayer
    lobbies[lobby_code][player.team_id].players.remove(player)
    return {"message": f"Left {player.team_id} in lobby {lobby_code}"}


def assign_team(lobby_code: str, player:Player):
    if not lobbies.get(lobby_code):
        raise HTTPException(status_code=404, detail="Lobby not found.")

    teamA, teamB = list(lobbies[lobby_code].values())
    #check if the max players limit has been reached
    if len(teamA.players) >= teamA.max_players and len(teamB.players) >= teamB.max_players:
        raise NotImplementedError() #TODO: Send message to start game if both teams are full
    
    if len(teamA.players) <= len(teamB.players):
        player.team_id = teamA.id
        teamA.players.append(player)
    else:
        player.team_id = teamB.id
        teamB.players.append(player)


#Socket endpoint to handle image processing and broadcasting messages
#@app.websocket("/ws/{lobby_code}")
#async def websocket_endpoint():
#    pass