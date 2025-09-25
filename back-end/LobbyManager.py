# Phiwokwakhe Khathwane : 2022004325
# Welcome Galane        : 2024671386 

from fastapi import HTTPException
from models import Lobby, Message, GameOverPayload, Player
from ConnectionManager import ConnectionManager
import services.service as sv
from models import Team, TimerReportPayload
import time
import asyncio

#Classed used to handle all lobby related operations
#- Uses the Connection manager for sending messages when it needs to.
#- This class also contains the game loop(for lobbies) and keeps track of which lobbies are active

class LobbyManager:
    def __init__(self, c_manager: ConnectionManager):
        self.c_manager = c_manager
        self.lobbies: dict[str, Lobby] = {}
        self.active_lobbies = {}
    
    #Method creates a new lobby with teams, and returns the teams and lobby code
    # It takes in the max number of people that can be in the lobby
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
    
    #Method which will start a certain lobby given the lobby code
    #- This will add the lobby in the list of active lobbies
    async def start_lobby_game(self,lobby_code:str):
        if not self.lobbies.get(lobby_code):
            return #lobby was not found
        if lobby_code in self.active_lobbies:
            return
        #start the game
        self.active_lobbies[lobby_code] = {"start_time": time.time() , "duration":60, "time_remaining" : 60}
        self.lobbies[lobby_code].game_status = 'running'
    
    #Game timer loop which manages the game_status state and lobby sessions
    #- Each lobby match will play for 1min
    #- If game isn't started with 3min, the lobby will be disposed
    #- After the game has completed, spectators will have another 1min to pull lobby details
    async def game_timer_loop(self):
        while True:
            now = time.time()
            for lobby_code, lobby_det in list(self.active_lobbies.items()):
                #Calculate the time elapsed
                elapsed = now - lobby_det["start_time"]
                self.active_lobbies[lobby_code]["time_remaining"] = lobby_det["duration"] - elapsed
                remaining = self.active_lobbies[lobby_code]["time_remaining"]

                if remaining <= 0:
                    await self._handle_game_over(lobby_code)
                else:
                    #broadcast timer results
                    message = Message(type="timer_report",payload= TimerReportPayload(time_remaining=remaining))
                    await self.c_manager.send_message_to_Lobby(lobby_code=lobby_code, message=message)
            
            #check for stale lobbyies
            # All lobies that are in-ective for more than 3minutes will be remove(and disconnected)
            for lobby_code, _ in list(self.lobbies.items()):
                #if lobby is active, we ignore it
                if lobby_code in self.active_lobbies:
                    continue
                
                #if lobby has exceeded it's inactive time, we mark it as game over to be disposed of
                #- This will send a message to the connected devices
                if self.lobbies[lobby_code].allowed_inactive_time <= 0:
                    await self._handle_game_over(lobby_code)
                else:
                    self.lobbies[lobby_code].allowed_inactive_time -= 1;
                
                #If game over, do a count down before deleting the lobby
                if self.lobbies[lobby_code].game_status == 'game_over':
                    self.lobbies[lobby_code].allowed_active_time_for_detail-=1
                
                #Lobby cleanup
                if self.lobbies[lobby_code].allowed_active_time_for_detail <= 0:
                    # delete the lobby
                    del self.lobbies[lobby_code]

            #sleep for 1 second
            await asyncio.sleep(1)

    #This method haldes the game_over broadcast message to lobby and disconnect lobbies
    async def _handle_game_over(self, lobby_code):
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

        #Remove the lobby from active lobbies
        if lobby_code in self.active_lobbies:
            del self.active_lobbies[lobby_code]

    #This method gets the team rankings according to the scores
    # First team is the winning team, and the second one is the lossig team
    def get_team_ranking(self, lobby_code:str) -> tuple[Team , Team]:
        #determine winning and lossing teams
        teamA,teamB = self.get_teams_in_lobby(lobby_code=lobby_code)
        if teamA.score > teamB.score:
            return teamA,teamB #(winning, lossing)
        return teamB, teamA #(winning, lossing)
   
   #Method to determine if both teams are full or not
    def are_teams_full(self,lobby_code:str) -> bool:
        teamA,teamB = self.get_teams_in_lobby(lobby_code)
        return teamA.max_players == len(teamA.players) and teamB.max_players == len(teamB.players)

    #Method to determine if the lobby exists given a lobby code
    def lobby_code_exists(self,lobby_code)->bool:
        return not not self.lobbies.get(lobby_code) #FIXME: Make this code more readable
    
    #Method to get a certain team from a certain lobby
    def get_team_from_lobby(self, lobby_code:str, team_name:str) -> Team | None:
        if self.lobby_code_exists(lobby_code):
            return self.lobbies[lobby_code].teams[team_name]
        return None
    
    #Method to get a lobby from lobby code
    def get_lobby(self, lobby_code: str) -> Lobby | None:
        lobby = self.lobbies.get(lobby_code)
        if lobby_code in self.active_lobbies and lobby:
            lobby.time_remaining = self.active_lobbies[lobby_code]["time_remaining"]
        return lobby
    
    #Method to get the two teams from a lobby
    def get_teams_in_lobby(self,lobby_code:str) -> tuple[Team,Team]:
        lobby = self.lobbies.get(lobby_code)
        if not lobby:
            raise HTTPException(status_code=500, detail="Lobby was not found.")
        #get teams
        teams = list(lobby.teams.values())
        teamA,teamB = teams[0],teams[1]
        return teamA, teamB
    
    #A method that checks if a lobby is active or not
    def is_lobby_active(self, lobby_code: str)-> bool:
        return lobby_code in self.active_lobbies
    
    #Method the removes a lobby, by settting the game_status to "game_over"
    def remove_lobby(self, lobby_code: str):
        # if lobby_code in self.lobbies:
        #     del self.lobbies[lobby_code]
        self.lobbies[lobby_code].game_status = 'game_over'

