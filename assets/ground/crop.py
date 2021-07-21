from PIL import Image

with Image.open('ground.png') as img:
    for i, season in enumerate(range(10)):
        for j, shape in enumerate(['tri', 'circ', 'quad']):
            left = (i+1) * 4 + i * 64
            upper = (j+1) * 4 + j * 64
            right = left + 64
            lower = upper + 64
            tmp = img.crop((left, upper, right, lower))

            tmp.save(f's{i}_{shape}.png')

    tmp = img.crop((4, 208, 4+128, 208+128))
    tmp.save('water.png')
    