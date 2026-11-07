# -*- coding: utf-8 -*-
"""social 图对齐 study/rest/exercise 三张的实测打光参数：
- 实测三张：顶(86-116) 中(77-94) 底(27-77)，自带暗部，无人工暗角/底部阴影
- 之前给 social 额外涂了暗角+底部阴影，反而比三张更暗（中部 106>三张），故移除人工压暗
- 曝光回到接近原图 1.0（原图过曝感主要来自高饱和，已降饱和抵消）
- 饱和度 0.90（140→约 126，对齐三张 111-133）
- 暖调（R×1.02 / B×0.94，轻微，向 exercise 暖色温靠拢）
- 仅保留极轻顶部窗光（alpha 18，对齐三张"上亮"但不压暗）
- 128 色量化，保持像素感
从备份原图处理，覆盖 frontend/assets/action-social-pixel.png。
"""
from PIL import Image, ImageEnhance, ImageStat
import os

def lum(i):
    s = ImageStat.Stat(i); r,g,b = s.mean
    return 0.2126*r+0.7152*g+0.0722*b

ROOT = r"C:\Users\Z\WorkBuddy\2026-10-23-22-47-56\qinghe_repo"
SRC = os.path.join(ROOT, "temp_social_tune", "action-social-pixel.orig.png")
OUT = os.path.join(ROOT, "frontend", "assets", "action-social-pixel.png")

im = Image.open(SRC).convert("RGB")
W, H = im.size
print("原图:", im.size)

# 1) 曝光（0.94：整体约 108，介于原图114与上一版99之间；靠降饱和抵消原过曝感）
im = ImageEnhance.Brightness(im).enhance(0.94)
# 2) 饱和度（0.80，对齐三张 111-133）
im = ImageEnhance.Color(im).enhance(0.80)
# 3) 轻微暖调（温和，避免把饱和度顶高）
r, g, b = im.split()
r = r.point(lambda v: min(255, int(v * 1.01)))
b = b.point(lambda v: int(v * 0.96))
im = Image.merge("RGB", (r, g, b))

# 4) 仅极轻顶部窗光（不压暗其他区域）
grad = Image.new("L", (1, H), 0)
for y in range(H):
    t = y / (H * 0.30)
    grad.putpixel((0, y), int(18 * max(0.0, 1.0 - t)) if t < 1.0 else 0)
im = Image.composite(Image.new("RGB", (W, H), (255, 210, 140)), im, grad.resize((W, H)))

# 5) 量化 + 保存
im = im.convert("P", palette=Image.ADAPTIVE, colors=128)
im.save(OUT, optimize=True)
size_kb = os.path.getsize(OUT) / 1024

im2 = Image.open(OUT).convert("RGB")
stat = ImageStat.Stat(im2)
rr, gg, bb = stat.mean
lum_all = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb
sat = ImageStat.Stat(im2.convert("HSV")).mean[1]
# 分区
top = lum(im2.crop((0, 0, W, int(H*0.35))))
mid = lum(im2.crop((int(W*0.15), int(H*0.30), int(W*0.85), int(H*0.72))))
bot = lum(im2.crop((0, int(H*0.65), W, H)))
print(f"处理后: 整体 {lum_all:.1f} | 顶 {top:.1f} | 中 {mid:.1f} | 底 {bot:.1f} | 饱和 {sat:.1f} R{rr:.0f} G{gg:.0f} B{bb:.0f} 体积 {size_kb:.0f}KB")
