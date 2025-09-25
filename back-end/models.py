# Phiwokwakhe Khathwane : 2022004325
# Welcome Galane        : 2024671386 

from turtle import st
from pydantic import BaseModel
from typing import Union, Literal

#Models for Teams and Players
class Player(BaseModel):
    id: int
    name: str
    team_id: str #Auto-generated when lobby is created
    hits: int

    #Define equality based on the player's id for use in list operations
    def __eq__ (self, other):
        if isinstance(other, Player):
            return self.id == other.id
        return False
    
    #Calculate the hash based on the player's id for use in dict keys
    def __hash__ (self):
        return hash(self.id)

#-This will be used for spectators to see team scores and player stats
class Team(BaseModel):
    id: str
    score: int = 0
    color: str
    shape: str
    hits: int = 0
    misses: int = 0
    shots: int = 0
    players: list[Player] = []
    max_players: int

    def get_player(self, user_id: int) -> Player | None:
        for player in self.players:
            if player.id == user_id:
                return player
        #user not found in team
        return None

class Lobby(BaseModel):
    teams: dict[str, Team]
    game_status: Literal['not_started','game_over','running'] = 'not_started'
    time_remaining: int = 60
    allowed_inactive_time: int =  60 #a lobby has a life time of 3 minuites before game_status = 'running', otherwise
                                      # it will be removed and everyone will be disconnected 
    
    allowed_active_time_for_detail: int = 30 # After the game has ended, the lobby will be allowed to be still active
                                             #   for another 30 seconds before it is being removed from the server
                                             #   this is because the spectators poll the data on certain intervals
                                             #   and do not get notifies immediately

#Models for WebSocket messages
class ShotHitPayload(BaseModel):
    team_score: int
    team_name: str
    player_id: int

class GameOverPayload(BaseModel):
    winning_team_name: str
    winning_team_score: int
    losing_team_name: str
    losing_team_score: int

class MissedShotPayload(BaseModel):
    shooter_id: int

class TimerReportPayload(BaseModel):
    time_remaining: float
#This is to be broadcasted everytime a new user connects to the websocket
class JoinedTeamPayload(BaseModel):
    user_name: str #User who just joined
    team_name: str #team they have been joined to
    members_remaining: int
    max_members: int

Payload = Union[ShotHitPayload, GameOverPayload, MissedShotPayload, TimerReportPayload, JoinedTeamPayload, None]

class Message(BaseModel):
    type: Literal['hit', 'shot', 'game_over', 'missed_shot', 'start_game','timer_report','join']
    payload: Payload