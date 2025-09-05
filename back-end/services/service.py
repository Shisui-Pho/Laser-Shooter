import random
from models import Team
colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
shapes = ['circle', 'square', 'triangle', 'rectangle']
color_ranges = {
    "red":    [([0, 100, 100], [10, 255, 255]), ([160, 100, 100], [179, 255, 255])],
    "blue":   [([100, 150, 0], [140, 255, 255])], #blue may need to increase the saturation(upperbound)
    "green":  [([40, 70, 70], [80, 255, 255])],
    "yellow": [([20, 100, 100], [30, 255, 255])],
    "orange": [([10, 100, 100], [20, 255, 255])],
    "purple": [([140, 100, 100], [160, 255, 255])]#purple identified as blue(I may need to decrease the saturation upper bound and lower bound)
}
shape_index = 0

def generate_lobby_code(existing: list, length=6):
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    while True:
        code  = ''.join(random.choice(characters) for _ in range(length))
        if code not in existing:
            return code

def pick_color_shape_combo():
    #for now, pick one shape and two colors randomly
    global shape_index
    shape = shapes[shape_index % len(shapes)]
    shape_index += 1
    color_combo = random.sample(colors, 2)
    return color_combo, shape

def generate_team_names(colors:list, shape:str):
    return "Team_" + colors[0].capitalize() + "_" + shape.capitalize(), "Team_" + colors[1].capitalize() + "_" + shape.capitalize()

def create_teams(lobbies: dict[str, dict[str, Team]] = {}):
    colors, shape = pick_color_shape_combo()
    teamA_id, teamB_id = generate_team_names(colors, shape)

    teamA = Team(id=teamA_id, score= 0, color=colors[0], shape=shape, hits=0, misses=0, shots=0, players=[])
    teamB = Team(id=teamB_id, score= 0, color=colors[1], shape=shape, hits=0, misses=0, shots=0, players=[])

    #TODO: validation of unique color/shape
    _ = lobbies
    return teamA, teamB
