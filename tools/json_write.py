import json
from utils import *
from SceneNode import SceneNode

DEBUG = False

assets = ['BigRock_01', 'BigRock_02', 'BigRock_03', 'Flower_04', 'Tree_01', 'Tree_03', 'Tree_05', 'Tree_06', 'SmallRock_01']

rocks = [a for a in assets if 'Rock' in a]
big_rocks = [a for a in assets if 'BigRock' in a]
trees = [a for a in assets if 'Tree' in a]


n_rocks = 50
n_trees = 300
span = 200

root = SceneNode('root')
add_ground(root)

objects = []

if not DEBUG:
    i = 0
    # Add perimeter rocks
    for x in [-span//2, span//2]:
        for z in range(-span//2, span//2, 4):
            model_name, position, scale, rotation = gen_rand_node_info(big_rocks, None, position=[x, 0, z], span=span)
            i += 1
            objects.append(SceneNode(f'perimeter_rock_{i}', model_name, position, scale, rotation))
    for z in [-span//2, span//2]:
        for x in range(-span//2, span//2, 4):
            model_name, position, scale, rotation = gen_rand_node_info(big_rocks, None, position=[x, 0, z], span=span)
            i += 1
            objects.append(SceneNode(f'perimeter_rock_{i}', model_name, position, scale, rotation))

    # Add some random rocks
    for i in range(n_rocks):
        coords = [a.get_coords() for a in objects]
        model_name, position, scale, rotation = gen_rand_node_info(rocks, coords, span=span)
        objects.append(SceneNode(f'rock_{i}', model_name, position, scale, rotation))

    # Add some random trees
    for i in range(n_trees):
        coords = [a.get_coords() for a in objects]
        model_name, position, scale, rotation = gen_rand_node_info(trees, coords, span=span)
        objects.append(SceneNode(f'tree_{i}', model_name, position, scale, rotation))
else:
    # Here are the debug nodes
    coords = []
    objects.append(SceneNode(name='Test', model='Tree_03', position=[0, 0, -4], scale=[1, 1, 1], rotation=[0, 0, 0]))

for obj in objects:
    root.append_child(obj)

with open('../scene-graph.json', 'w') as outfile:
    json.dump(root.get_data(), outfile, indent=4)
    print('File written!')