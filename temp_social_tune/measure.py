# -*- coding: utf-8 -*-
"""测量四张 action 模块图的平均亮度/饱和度，为 social 图曝光调整提供目标值。"""
from PIL import Image, ImageStat
import os

ASSETS = r"C:\Users\Z\WorkBuddy\2026-10-23-22-47-56\qinghe_repo\frontend\assets"
NAMES = ["action-study-pixel.png", "action-rest-pixel.png",
         "action-exercise-pixel.png", "action-social-pixel.png"]

print(f"{'图':34s} {'尺寸':12s} {'平均亮度':>8s} {'R':>5s} {'G':>5s} {'B':>5s} {'饱和度':>7s}")
for name in NAMES:
    p = os.path.join(ASSETS, name)
    im = Image.open(p).convert("RGB")
    stat = ImageStat.Stat(im)
    r, g, b = stat.mean
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    hsv = ImageStat.Stat(im.convert("HSV"))
    sat = hsv.mean[1]
    print(f"{name:34s} {str(im.size):12s} {lum:8.1f} {r:5.1f} {g:5.1f} {b:5.1f} {sat:7.1f}")
