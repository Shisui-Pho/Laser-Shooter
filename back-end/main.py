from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from ComputerVisionModel import ComputerVisionModel
import services.service as sv
from models import MissedShotPayload, Player,Team, ShotHitPayload, GameOverPayload, Message
from ConnectionManager import ConnectionManager
from LobbyManager import LobbyManager


#models and managers definitions
vision_model = ComputerVisionModel()
c_manager = ConnectionManager()
l_manager = LobbyManager(c_manager)

#ounter variable for player id's
id_counter : int = 0

#create a background task for the game timer
@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(l_manager.game_timer_loop())
    yield

app = FastAPI(lifespan=lifespan)

#CORS configuration: allow requests from any origin (temp for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],#TODO: Change this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Phiwo and Galane were here!"}


#Get methods for api endpoints
@app.post("/CreateLobby/{max_players}")
async def create_lobby(max_players: int):
    if max_players % 2 != 0 or max_players < 2:
        raise HTTPException(status_code=400, detail="max_players must be an even number greater than or equal to 2.")
    
    #create the teams and lobby simultaniously
    lobby_code, teamA, teamB = l_manager.create_lobby(max_players)
    colors = [teamA.color, teamB.color]
    return {
        "lobby_code": lobby_code,
        "colors": colors,
        "shape": teamA.shape, #the shapes are the same for both teams 
        "teams": [teamA.id, teamB.id]
        }


@app.post("/JoinLobby/{lobby_code}/{username}")
async def join_lobby(lobby_code: str, username: str):
    global id_counter
    if not l_manager.lobby_code_exists(lobby_code):
        raise HTTPException(status_code=404, detail="Lobby not found.")
    
    player = Player(id=id_counter, name=username, team_id="", hits=0)
    id_counter += 1
    #Assign the player to a team randomly(well, not really randomly, but balancing the teams)
    assign_team(lobby_code, player)
    return {"message": f"Joined lobby {lobby_code}","user": player}


@app.get("/GetLobbyDetails/{lobby_code}")
async def get_lobby_details(lobby_code: str):
    if not l_manager.lobby_code_exists(lobby_code):
        raise HTTPException(status_code=404, detail="Lobby not found.")
    lobby = l_manager.get_lobby(lobby_code)
    print('\n\n\n\n\n\n\n',lobby,'\n\n\n\n\n\n\n')
    return {"teams": {} if not lobby else lobby}

    
@app.post("/LeaveTeam/{lobby_code}")
async def leave_team(lobby_code: str, player: Player):
    if not l_manager.lobby_code_exists(lobby_code):
        raise HTTPException(status_code=404, detail="Lobby not found.")
    
    team = l_manager.get_team_from_lobby(lobby_code, player.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found in this lobby.")

    if player not in team.players:
        raise HTTPException(status_code=404, detail="Player not found in this team.")
    
    #remove th eplayer
    team.players.remove(player)
    return {"message": f"Left {player.team_id} in lobby {lobby_code}"}


def assign_team(lobby_code: str, player:Player):
    if not l_manager.lobby_code_exists(lobby_code):
        raise HTTPException(status_code=404, detail="Lobby not found.")
    
    #everytime a player is added to a team, they will be connected to 
    # the websockets which will check if the maximum player count has been reached yet
    teamA, teamB = l_manager.get_teams_in_lobby(lobby_code) 
    if len(teamA.players) <= len(teamB.players):
        player.team_id = teamA.id
        teamA.players.append(player)
    else:
        player.team_id = teamB.id
        teamB.players.append(player)


