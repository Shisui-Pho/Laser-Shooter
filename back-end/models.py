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
    score: int
    color: str
    shape: str
    hits: int
    misses: int
    shots: int
    players: list[Player] = []
    max_players: int


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
    time_remaining: int

Payload = Union[ShotHitPayload, GameOverPayload, MissedShotPayload, TimerReportPayload, None]

class Message(BaseModel):
    type: Literal['hit', 'shot', 'game_over', 'missed_shot', 'start_game','timer_report']
    payload: Payload