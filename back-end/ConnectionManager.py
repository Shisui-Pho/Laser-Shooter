from fastapi import WebSocket
from models import Message

class ConnectionManager:
    def __init__(self):
        #Just like the lobbies dictionary, but with WebSocket connections instead of Player objects
        #- The outer dictionary key is the lobby code
        #- The inner dictionary key is the team name and the value is a list of WebSocket connections for that team
        self.active_connections: dict[str, dict[str,list[WebSocket]]] = {}
    
    async def connect(self, lobby_code: str, team_name: str, websocket: WebSocket):
        await websocket.accept()
        if lobby_code not in self.active_connections.keys():
            self.active_connections[lobby_code] = {} #Initialize the lobby entry if it doesn't exist

        #Check if the team already has an entry in the lobby's connection list
        if team_name not in self.active_connections[lobby_code].keys():
            self.active_connections[lobby_code][team_name] = [] #Initialize the team entry if it doesn't exist
        
        #Add the new connection to the list for this team
        self.active_connections[lobby_code][team_name].append(websocket)

    def disconnect(self, lobby_code: str, team_name: str, websocket: WebSocket):

        self.active_connections[lobby_code][team_name].remove(websocket)
        
        #If the team has no more active connections, remove the team entry
        if not self.active_connections[lobby_code][team_name]:
            del self.active_connections[lobby_code][team_name]

        #If the lobby has no more active connections, remove the lobby entry
        if not self.active_connections[lobby_code]:
            del self.active_connections[lobby_code]
    
    async def send_message_to_team(self,lobby_code:str, team_name:str, message: Message):

        #Broadcase the message to all connections in the specified team of the specified lobby
        if lobby_code in self.active_connections.keys():
            if team_name in self.active_connections[lobby_code].keys():
                for connection in self.active_connections[lobby_code][team_name]:
                    await connection.send_json(message.model_dump_json())

    async def send_message_to_Lobby(self, lobby_code:str,message:Message):

        #Broadcast the message to all connections in the specified lobby
        if lobby_code in self.active_connections.keys():
            
            #At most, we will have 2 teams in a lobby, so we can iterate through both teams and send the message to each
            for team in self.active_connections[lobby_code].keys():
                for connection in self.active_connections[lobby_code][team]:
                    await connection.send_json(message.model_dump_json())

