# Phiwokwakhe Khathwane : 2022004325
# Welcome Galane        : 2024671386 

import random
from models import Lobby, Player, Team

#Predefined colors and shapes
colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
shapes = ['circle', 'square', 'triangle', 'rectangle']

#Predefined HSV(Hue Saturation and Value) color ranges used for masking images to detect the shape
# - Each colour has a lower bound HSV and an upper bound HSV
color_ranges = {
    "red":    [([0, 100, 100], [10, 255, 255]), ([160, 100, 100], [179, 255, 255])],
    "blue":   [([100, 150, 0], [140, 255, 255])], 
    "green":  [([40, 70, 70], [80, 255, 255])],
    "yellow": [([20, 100, 100], [30, 255, 255])],
    "orange": [([10, 100, 100], [20, 255, 255])],
    "purple": [([140, 100, 100], [160, 255, 255])]
}
#Temp: Index variable to pick a color and a shape
shape_index = 0

#Method used to generate a random code from predefined characters
#- by default we use a 6 letters code, and it must be unique from existing lobbies
def generate_lobby_code(existing: list, length=6):
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    while True:
        code  = ''.join(random.choice(characters) for _ in range(length))
        if code not in existing:
            return code

#Method used to pick a color shape combo for teams
#- For now, colors are picked randomly while shapes are picked incrementally
#- For future updates(if there will be), both colors and shapes will be random
#      and there will be collision checking to see if a certain color shape combo has been used.
def pick_color_shape_combo():
    #for now, pick one shape and two colors randomly
    global shape_index
    shape = shapes[shape_index % len(shapes)]
    shape_index += 1
    color_combo = random.sample(colors, 2)
    return color_combo, shape

#Helper method to generate team names
#- The names will be used as id's as well to identify a team
def generate_team_names(colors:list, shape:str):
    return "Team_" + colors[0].capitalize() + "_" + shape.capitalize(), "Team_" + colors[1].capitalize() + "_" + shape.capitalize()

#Method to create a team, using the previous two methods
#- The same shape is assigned for both teams but different shapes
def create_teams(lobbies: dict[str, dict[str, Team]] = {}):
    colors, shape = pick_color_shape_combo()
    teamA_id, teamB_id = generate_team_names(colors, shape)

    teamA = Team(id=teamA_id, score= 0, color=colors[0], shape=shape, hits=0, misses=0, shots=0, players=[], max_players=0)
    teamB = Team(id=teamB_id, score= 0, color=colors[1], shape=shape, hits=0, misses=0, shots=0, players=[], max_players=0)

    #TODO: validation of unique color/shape
    _ = lobbies
    return teamA, teamB

#The json data should contain the following keys:
#- image: base64 encoded image string
#- player: a Player object in dict format
#- color: the color that is being seeing by the player
def decode_json(data):
    image_data = data.get("image")
    player = Player(**data.get("player"))
    color = data.get("color")
    color_range = color_ranges.get(color)
    return image_data, player, color_range

#API response body for lobby details
def to_lobby_details_json(lobby_code:str, lobby: Lobby):
    teams = [team for team in lobby.teams.values()]
    teamA, teamB = teams[0], teams[1]
    return {"code": lobby_code,
        "colors": [teamA.color, teamB.color],
        "shape": teamA.shape,
        "teams": [teamA, teamB],
        "game_status": lobby.game_status,
        "time_remaining": lobby.time_remaining}

#API response body for lobby creation status
def to_lobby_creation_json(lobby_code:str, teamA: Team, teamB: Team, game_status: str = "not_started"):
    return {"lobby_code": lobby_code,
        "colors": [teamA.color, teamB.color],
        "shape": teamA.shape,
        "teams": [teamA.id, teamB.id],
        "game_status": game_status}