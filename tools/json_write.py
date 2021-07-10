import json
import random
from utils import *
from SceneNode import SceneNode

assets = ['BigRock_01', 'BigRock_02', 'BigRock_03', 'Flower_04', 'Tree_01', 'Tree_03', 'Tree_05', 'Tree_06', 'SmallRock_01']

rocks = [a for a in assets if 'Rock' in a]
trees = [a for a in assets if 'Tree' in a]


n_rocks = 50
n_trees = 900

root = SceneNode('root')
add_ground(root)

objects = []

for i in range(n_rocks):
    coords = [a.get_coords() for a in objects]
    model_name, position, scale, rotation = gen_rand_node_info(rocks, coords, span=200)
    objects.append(SceneNode(i, model_name, position, scale, rotation))

for i in range(n_trees):
    coords = [a.get_coords() for a in objects]
    model_name, position, scale, rotation = gen_rand_node_info(trees, coords, span=200)
    objects.append((SceneNode(i, model_name, position, scale, rotation)))

for obj in objects:
    root.append_child(obj)

with open('../scene-graph.json', 'w') as outfile:
    json.dump(root.get_data(), outfile, indent=4)