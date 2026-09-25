from PIL import Image, ImageDraw
src = Image.open('design/assets/chunk-logo.png').convert('RGB')
# bounding box of non-white pixels = the rounded-square logo
m = Image.eval(src.convert('L'), lambda v: 255 if v < 235 else 0)
box = m.getbbox(); print('bbox', box)
box = (box[0]+8, box[1]+8, box[2]-8, box[3]-8)
logo = src.crop(box)
w, h = logo.size; s = max(w, h)
orange = logo.getpixel((w // 2, 8)); print('orange', orange)
# full-bleed square: paint the white rounded corners orange
sq = Image.new('RGB', (s, s), orange); sq.paste(logo, ((s - w) // 2, (s - h) // 2))
ox, oy = (s - w) // 2, (s - h) // 2
for c in [(ox, oy), (ox + w - 1, oy), (ox, oy + h - 1), (ox + w - 1, oy + h - 1)]:
    ImageDraw.floodfill(sq, c, orange, thresh=110)
icon = sq.resize((1024, 1024), Image.LANCZOS)
icon.save('assets/images/icon.png')
# Android adaptive foreground: keep art inside the 66% safe zone
fg = Image.new('RGB', (1024, 1024), orange); fg.paste(sq.resize((740, 740), Image.LANCZOS), (142, 142))
fg.save('assets/images/android-icon-foreground.png')
# splash + favicon: rounded logo on transparent
r = Image.new('L', (s, s), 0); ImageDraw.Draw(r).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.2), fill=255)
rounded = sq.convert('RGBA'); rounded.putalpha(r)
rounded.resize((1024, 1024), Image.LANCZOS).save('assets/images/splash-icon.png')
rounded.resize((48, 48), Image.LANCZOS).save('assets/images/favicon.png')
print('#%02X%02X%02X' % orange)
