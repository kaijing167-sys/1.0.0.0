import glob, os
from PIL import Image

base = r"C:\Users\Z\WorkBuddy\2026-10-23-22-47-56\qinghe_repo"
src = sorted(glob.glob(os.path.join(base, "temp_study_bg", "*.png")))[0]
dst = os.path.join(base, "frontend", "assets", "study-minigame-bg.png")

im = Image.open(src).convert("RGB")
print("orig size:", im.size)
im = im.resize((768, 512), Image.LANCZOS)
im = im.quantize(colors=128, method=Image.MEDIANCUT)
im.save(dst, optimize=True)
print("saved:", dst, os.path.getsize(dst), "bytes")
