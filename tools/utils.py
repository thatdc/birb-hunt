from SceneNode import SceneNode
import random
import math

def gen_scale(model_name):
    if 'Flower' in model_name:
        return random.uniform(1, 2)
    elif 'Tree' in model_name:
        return random.uniform(1, 1.25)
    else:
        return 1

def add_ground(root: SceneNode):
    root.append_child(SceneNode(name='ground', model='Ground'))

def gen_rand_node_info(models, other_coords, position=None, span=200):
    # Name
    model_name = random.choice(models)
    # Position
    while position is None:
        tx = random.uniform(-span//2, span//2)
        ty = 0
        tz = random.uniform(-span//2, span//2)
        
        # Verify collisions
        collide = False
        for c in other_coords:
            if distance([tx, tz], c) <= 5:
                collide = True
                break
        if not collide:
            position = [tx, ty, tz] 
            break
    # Scale
    s = gen_scale(model_name)
    scale = [s, s, s]
    # Rotation
    ry = random.randint(0, 360)
    rotation = [0, ry, 0]

    return model_name, position, scale, rotation

def distance(a, b):
    return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)
