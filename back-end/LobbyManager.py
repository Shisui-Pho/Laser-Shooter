from fastapi import HTTPException
from models import Lobby, Message, GameOverPayload, Player
from ConnectionManager import ConnectionManager
import services.service as sv
from models import Team, TimerReportPayload
import time
import asyncio

class LobbyManager:
    def __init__(self, c_manager: ConnectionManager):
        self.c_manager = c_manager
        #self.lobbies: dict[str, dict[str, Team]] = {}
        self.lobbies: dict[str, Lobby] = {}
        self.active_lobbies = {}
    
    def create_lobby(self, max_players) -> tuple[str, Team, Team]:
        #create a new lobby code
        lobby_code = sv.generate_lobby_code(list(self.lobbies.keys()))

        #create two teams with random color/shape combinations
        #TODO: Make sure teams get unique shape and colours, so that they don't overlap
        teamA, teamB = sv.create_teams()
        teamA.max_players = max_players // 2
        teamB.max_players = max_players // 2

        self.lobbies[lobby_code] = Lobby(teams = {teamA.id : teamA, teamB.id : teamB})

        return lobby_code, teamA, teamB
    
    async def start_lobby_game(self,lobby_code:str):
        if not self.lobbies.get(lobby_code):
            return #lobby was not found
        if lobby_code in self.active_lobbies:
            return
        #broadcast message before starting the game to avoid timer from ....
        #message = Message(type="start_game",payload= None)
        #await self.c_manager.send_message_to_Lobby(lobby_code,message)
        #start the game
        self.active_lobbies[lobby_code] = {"start_time": time.time() , "duration":60}
        self.lobbies[lobby_code].game_status = 'running'
        
    async def game_timer_loop(self):
        while True:
            now = time.time()
            for lobby_code, lobby_det in self.active_lobbies.items():
                elapsed = now - lobby_det["start_time"]
                remaining = lobby_det["duration"] - elapsed

                if remaining <= 0:
                    #game over broadcast
                    winner,looser = self.get_team_ranking(lobby_code)
                    game_over = GameOverPayload(winning_team_name=winner.id, winning_team_score=looser.score, 
                                                losing_team_name=looser.id, losing_team_score=looser.score)
                    message = Message(type="game_over",payload=game_over)
                    #update lobby game status
                    self.lobbies[lobby_code].game_status = 'game_over'
                    #broad-cast results
                    await self.c_manager.send_message_to_Lobby(lobby_code=lobby_code, message=message)
                    await self.c_manager.disconnect_lobby(lobby_code=lobby_code)
                else:
                    #broadcast timer results
                    message = Message(type="timer_report",payload= TimerReportPayload(time_remaining=remaining))
                    await self.c_manager.send_message_to_Lobby(lobby_code=lobby_code, message=message)
            
            #after checking the time for all active lobbies,
            #-sleep for 1 second
            await asyncio.sleep(1)

    def get_team_ranking(self, lobby_code:str) -> tuple[Team , Team]:
        #determine winning and lossing teams
        teamA,teamB = self.get_teams_in_lobby(lobby_code=lobby_code)
        if teamA.score > teamB.score:
            return teamA,teamB
        return teamB, teamA
   
    def are_teams_full(self,lobby_code:str) -> bool:
        teamA,teamB = self.get_teams_in_lobby(lobby_code)
        return teamA.max_players == len(teamA.players) and teamB.max_players == len(teamB.players)

    def lobby_code_exists(self,lobby_code)->bool:
        return not not self.lobbies.get(lobby_code) #FIXME: Make this code more readable
    
    def get_team_from_lobby(self, lobby_code:str, team_name:str) -> Team | None:
        if self.lobby_code_exists(lobby_code):
            return self.lobbies[lobby_code].teams[team_name]
        return None
    
    def get_lobby(self, lobby_code: str) -> Lobby | None:
        lobby = self.lobbies.get(lobby_code)
        return lobby
    
    def get_teams_in_lobby(self,lobby_code:str) -> tuple[Team,Team]:
        lobby = self.lobbies.get(lobby_code)
        if not lobby:
            raise HTTPException(status_code=500, detail="Lobby was not found.")
        #get teams
        teams = list(lobby.teams.values())
        teamA,teamB = teams[0],teams[1]
        return teamA, teamB
    def is_lobby_active(self, lobby_code: str)-> bool:
        return lobby_code in self.active_lobbies