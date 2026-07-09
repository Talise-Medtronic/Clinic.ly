from PIL import Image
img = Image.open('src/assets/koala-mascot.png').convert('RGBA')
print('size', img.size, 'mode', img.mode)
coords = [(0,0),(img.width-1,0),(0,img.height-1),(img.width-1,img.height-1),(img.width//2,img.height//2)]
for coord in coords:
    print(coord, img.getpixel(coord))
