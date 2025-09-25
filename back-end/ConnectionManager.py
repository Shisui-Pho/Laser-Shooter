# Phiwokwakhe Khathwane : 2022004325
# Welcome Galane        : 2024671386 

from fastapi import WebSocket
from models import Message
from starlette.websockets import WebSocketState

# This class handle all the connections for lobbies and teams
# It also handles the sending of messages to different teams, lobbies and individuals
class ConnectionManager:
    def __init__(self):
       # Dictionary for all active lobbies
        #- The outer dictionary key is the lobby code
        #- The inner dictionary key is the team name and the value is a list of WebSocket connections for that team
        self.active_connections: dict[str, dict[str,list[WebSocket]]] = {}
    
    #Method for adding and connecting a client(player) to the lobby
    async def connect(self, lobby_code: str, team_name: str, websocket: WebSocket):
        await websocket.accept()
        if lobby_code not in self.active_connections.keys():
            self.active_connections[lobby_code] = {} #Initialize the lobby entry if it doesn't exist

        #Check if the team already has an entry in the lobby's connection list
        if team_name not in self.active_connections[lobby_code].keys():
            self.active_connections[lobby_code][team_name] = [] #Initialize the team entry if it doesn't exist
        
        #Add the new connection to the list for this team
        self.active_connections[lobby_code][team_name].append(websocket)

    #Method for removing a websocket from the lobby and team
    #- The actual disconnecting of the websocket will be handled on the websocket endpoint
    def disconnect(self, lobby_code: str, team_name: str, websocket: WebSocket):
        if lobby_code in self.active_connections and team_name in self.active_connections[lobby_code]:
            self.active_connections[lobby_code][team_name].remove(websocket)
        else:
            return
        
        #If the team has no more active connections, remove the team entry
        if not self.active_connections[lobby_code][team_name]:
            del self.active_connections[lobby_code][team_name]

        #If the lobby has no more active connections, remove the lobby entry
        if not self.active_connections[lobby_code]:
            del self.active_connections[lobby_code]
    
    #Broadcasting a message to a specific team in a specific lobby
    #-broadcast if the connection is open
    async def send_message_to_team(self,lobby_code:str, team_name:str, message: Message):
        if lobby_code in self.active_connections.keys():
            if team_name in self.active_connections[lobby_code].keys():
                for connection in self.active_connections[lobby_code][team_name]:
                    if connection.client_state == WebSocketState.CONNECTED:
                        await connection.send_json(message.model_dump_json())

    #Broadcasting a message to a specific lobby
    #-broadcast if the connection is open
    async def send_message_to_Lobby(self, lobby_code:str,message:Message):
        if lobby_code in self.active_connections.keys():
            #At most, we will have 2 teams in a lobby, so we can iterate through both teams and send the message to each
            for team in self.active_connections[lobby_code].keys():
                for connection in self.active_connections[lobby_code][team]:
                    if connection.client_state == WebSocketState.CONNECTED:
                        await connection.send_json(message.model_dump_json())

    #Send a message to just one player
    async def send_personal_message(self, message: Message, websocket: WebSocket):
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.send_json(message.model_dump_json())
    
    #Method for disconnecting the entire lobby from the game sockets
    async def disconnect_lobby(self, lobby_code:str):
        lobby = self.active_connections.get(lobby_code)
        if not lobby:
            return
        #Disconnect everyone on the lobby
        for team_id, team_connections in list(lobby.items()):
            for connection in team_connections:
                if connection.client_state == WebSocketState.CONNECTED:
                    await connection.close(code=1000)

        #delete lobby connections
        await self._remove_lobby_connections(lobby_code)

    async def _remove_lobby_connections(self, lobby_code:str):
        if lobby_code in self.active_connections:
            del self.active_connections[lobby_code]
