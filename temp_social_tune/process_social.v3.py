# -*- coding: utf-8 -*-
"""social 图曝光/光影调整：
- 曝光 0.76（亮度 114→约 87，向其余三张平均值 82 靠拢）
- 饱和度 0.87（140→约 122）
- 暖调（R×1.03 / B×0.92，向 exercise 的强暖色温靠拢）
- 顶部暖光渐隐（对齐 rest/exercise 的"上亮"）
- 四角 vignette（最多压暗 18%）
- 底部前景阴影（62% 高度起渐暗至 0.58，对齐 rest/exercise 的"下暗"）
- 128 色量化，保持像素感与体积
从备份原图处理，覆盖 frontend/assets/action-social-pixel.png。
"""
from PIL import Image, ImageEnhance, ImageStat
import os

ROOT = r"C:\Users\Z\WorkBuddy\2026-10-23-22-47-56\qinghe_repo"
SRC = os.path.join(ROOT, "temp_social_tune", "action-social-pixel.orig.png")
OUT = os.path.join(ROOT, "frontend", "assets", "action-social-pixel.png")

im = Image.open(SRC).convert("RGB")
W, H = im.size
print("原图:", im.size)

# 1) 曝光（提亮：之前 0.76 太暗，提到 0.95 看齐 study 图）
im = ImageEnhance.Brightness(im).enhance(0.95)
# 2) 饱和度
im = ImageEnhance.Color(im).enhance(0.88)
# 3) 暖调
r, g, b = im.split()
r = r.point(lambda v: min(255, int(v * 1.03)))
b = b.point(lambda v: int(v * 0.92))
im = Image.merge("RGB", (r, g, b))

black = Image.new("RGB", (W, H), (0, 0, 0))

# 4) 顶部暖光（alpha 30 → 35% 高度处归零）
grad = Image.new("L", (1, H), 0)
for y in range(H):
    t = y / (H * 0.35)
    grad.putpixel((0, y), int(30 * max(0.0, 1.0 - t)) if t < 1.0 else 0)
im = Image.composite(Image.new("RGB", (W, H), (255, 205, 130)), im, grad.resize((W, H)))

# 5) 四角 vignette（角部最多压暗 ~12%，减弱避免整体过暗）
vig = Image.radial_gradient("L").resize((W, H))
vmax = vig.getextrema()[1]
vig = vig.point(lambda v: int((v / vmax) * 30))
im = Image.composite(black, im, vig)

# 6) 底部前景阴影（62% 高度起，ease-in 到 alpha 68，减弱）
grad2 = Image.new("L", (1, H), 0)
for y in range(H):
    t = y / H
    if t > 0.62:
        k = (t - 0.62) / 0.38
        grad2.putpixel((0, y), int(68 * (k ** 1.5)))
im = Image.composite(black, im, grad2.resize((W, H)))

# 7) 量化 + 保存
im = im.convert("P", palette=Image.ADAPTIVE, colors=128)
im.save(OUT, optimize=True)
size_kb = os.path.getsize(OUT) / 1024

# 8) 验证数值
im2 = Image.open(OUT).convert("RGB")
stat = ImageStat.Stat(im2)
rr, gg, bb = stat.mean
lum = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb
sat = ImageStat.Stat(im2.convert("HSV")).mean[1]
print(f"处理后: 亮度 {lum:.1f}（目标约 82-90） 饱和度 {sat:.1f}（目标约 115-128） R{rr:.0f} G{gg:.0f} B{bb:.0f} 体积 {size_kb:.0f}KB")
