from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from ComputerVisionModel import ComputerVisionModel
import services.service as sv
from models import MissedShotPayload, Player,Team, ShotHitPayload, JoinedTeamPayload, Message
from ConnectionManager import ConnectionManager
from LobbyManager import LobbyManager


#models and managers definitions
vision_model = ComputerVisionModel()
c_manager = ConnectionManager()
l_manager = LobbyManager(c_manager)

#counter variable for player id's
id_counter : int = 1

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
    
    #return a nicely formated lobby details object
    return sv.to_lobby_creation_json(lobby_code, teamA, teamB)


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
    if not lobby:
        return {"message": "lobby not found"}

    #return a nicely formated lobby details    
    return sv.to_lobby_details_json(lobby_code, lobby)

    
@app.post("/LeaveTeam/{lobby_code}")
async def leave_team(lobby_code: str, player: Player):
    if not l_manager.lobby_code_exists(lobby_code):
        return {"message" : "Lobby code does not exist."} #
    
    team = l_manager.get_team_from_lobby(lobby_code, player.team_id)
    if not team:
        return {"message" : "Team does not exist."}

    if player not in team.players:
        return {"message" : "Player not in the team."}
    
    #remove th eplayer
    team.players.remove(player)

    #if there are no player on the team, delete the lobby session
    if len(team.players) == 0:
        l_manager.remove_lobby(lobby_code)

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

#Socket endpoint to handle image processing and broadcasting messages
@app.websocket("/ws/{lobby_code}/{team_name}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, lobby_code: str, team_name:str, user_id: int):
    #You can only connect if the lobby and team exist
    if not l_manager.lobby_code_exists(lobby_code):
        await websocket.close(code=1000)
        return
    team = l_manager.get_team_from_lobby(lobby_code, team_name)
    if not team:
        await websocket.close(code=1000)
        return
    #No one can join when a lobby is active
    if l_manager.is_lobby_active(lobby_code):
        await websocket.close(code=100)
        return
    #if player is not in the team
    player = team.get_player(user_id)
    if not player:
        await websocket.close(code=1000)
        return
    #connect to the websocket
    await c_manager.connect(lobby_code,team_name, websocket)

    #Broadcast successful joined message to lobby
    joined_payload = JoinedTeamPayload(user_name=player.name, team_name=team_name, 
                                      members_remaining=team.max_players - len(team.players), max_members=team.max_players)
    message = Message(type='join', payload=joined_payload)
    await c_manager.send_message_to_Lobby(lobby_code, message)

    #Check if the lobby is full yet
    if l_manager.are_teams_full(lobby_code):
        #send a start game signal
        message = Message(type="start_game", payload=None)
        await c_manager.send_message_to_Lobby(lobby_code=lobby_code, message=message)
        await l_manager.start_lobby_game(lobby_code)
    try:
        while True:
           #TODO: Recieve bytes instead
           data = await websocket.receive_json()
           #decode the json data
           image_data, player, color_range = sv.decode_json(data)
           missed_payload = MissedShotPayload(shooter_id=player.id)
           message = Message(type="missed_shot", payload=missed_payload)
           if not color_range:
               #broadcast a missed shot message
               await c_manager.send_personal_message(message, websocket)
               continue
           #detect the shape in the image
           detected_shape = vision_model.detect_shape(image_data, color_range)
           if not detected_shape or len(detected_shape) != 1:
                #broadcast a missed shot message
                await c_manager.send_personal_message(message, websocket)
                continue
           is_valid, opponent_team = is_valid_hit(detected_shape[0], team, lobby_code)
           if not is_valid or not opponent_team:
                #broadcast a missed shot message
                await c_manager.send_personal_message(message, websocket)
                continue
           
           #handle valid shot
           await handle_valid_hit(lobby_code, team, opponent_team, player)
           #Game over is handled by the loop defined h=in the lobby manager
           

    except WebSocketDisconnect as e:
        c_manager.disconnect(lobby_code,team_name, websocket)
        try:
            await websocket.close()
        except:
            pass

async def handle_valid_hit(lobby_code:str, team_shooter: Team, team_shot : Team, player_shooter: Player):
    #Record a hit
    team_shooter.hits += 1
    team_shooter.score += 15
    player_shooter.hits += 1
    hit_payload = ShotHitPayload(team_score=team_shooter.score, team_name=team_shooter.id, player_id=player_shooter.id)
    message = Message(type="hit", payload=hit_payload)
    
    #braodcast a hit message to all players in the shooter team
    await c_manager.send_message_to_team(lobby_code,team_shooter.id,message)

    #Record a short
    team_shot.shots += 1
    shot_payload = ShotHitPayload(team_score=team_shot.score,team_name=team_shot.id, player_id=player_shooter.id)
    message = Message(type="shot", payload=shot_payload)
    
    #broadcast a shot message to all players in the opposing team
    await c_manager.send_message_to_team(lobby_code,team_shot.id,message)

def is_valid_hit(detected_shape:str, team:Team, lobby_code:str) -> tuple[bool,Team | None]:    

    teamA, teamB = l_manager.get_teams_in_lobby(lobby_code)
    
    if not teamA or not teamB:
        raise HTTPException(status_code=500, detail="Opposing team not found.")
    
    if detected_shape == teamA.shape:
        return True, teamA if teamA.id != team.id else teamB
    return False, None