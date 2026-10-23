@echo off
cd /d "%~dp0"
echo Starting Qinghe Chronicle at http://127.0.0.1:8080/frontend/
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:8080/frontend/'"
python -m http.server 8080 --bind 127.0.0.1
