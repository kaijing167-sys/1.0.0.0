# -*- coding: utf-8 -*-
from PIL import Image, ImageStat
import os

ROOT = r"C:\Users\Z\WorkBuddy\2026-10-23-22-47-56\qinghe_repo"
names = {
    "study":    "frontend/assets/action-study-pixel.png",
    "rest":     "frontend/assets/action-rest-pixel.png",
    "exercise": "frontend/assets/action-exercise-pixel.png",
    "social":   "frontend/assets/action-social-pixel.png",
}

def lum(im):
    s = ImageStat.Stat(im)
    r, g, b = s.mean
    return 0.2126*r + 0.7152*g + 0.0722*b

def region_lum(im, box):
    return lum(im.crop(box))

for nm, p in names.items():
    im = Image.open(os.path.join(ROOT, p)).convert("RGB")
    W, H = im.size
    # 整体
    full = lum(im)
    # 顶部 0-35% 高度
    top = region_lum(im, (0, 0, W, int(H*0.35)))
    # 中部 30-72%
    mid = region_lum(im, (int(W*0.15), int(H*0.30), int(W*0.85), int(H*0.72)))
    # 底部 65-100%
    bot = region_lum(im, (0, int(H*0.65), W, H))
    sat = ImageStat.Stat(im.convert("HSV")).mean[1]
    print(f"{nm:9s} 整体 {full:5.1f} | 顶 {top:5.1f} | 中 {mid:5.1f} | 底 {bot:5.1f} | 饱和 {sat:5.1f}")
