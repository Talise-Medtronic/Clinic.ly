from PIL import Image
import math

path = 'src/assets/koala-mascot.png'
img = Image.open(path).convert('RGBA')
data = img.getdata()

bg_color = (198, 228, 255)
threshold = 100

new_data = []
removed = 0
for px in data:
    r, g, b, a = px
    dist = math.sqrt((r - bg_color[0])**2 + (g - bg_color[1])**2 + (b - bg_color[2])**2)
    if a > 0 and dist < threshold:
        new_data.append((r, g, b, 0))
        removed += 1
    else:
        new_data.append(px)

img.putdata(new_data)
img.save(path)
print(f'Saved {path} with {removed} transparent pixels')
