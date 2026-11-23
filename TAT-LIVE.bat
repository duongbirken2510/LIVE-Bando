@echo off
chcp 65001 >nul
title Tat Live & Giai phong Port 4012 - Viet Nam Dat Nuoc Ta Oi (LIVE-BANDO)

echo Dang gui lenh tat mem toi Server Viet Nam Dat Nuoc Ta Oi (Port 4012)...
powershell -NoProfile -Command "try { Invoke-RestMethod -Method Post -Uri 'http://localhost:4012/api/server/shutdown' -TimeoutSec 3 | Out-Null; Write-Host 'Da gui lenh tat thanh cong!' } catch { Write-Host 'Dang quet tien trinh chiem cong 4012...' }"

timeout /t 1 /nobreak >nul

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4012 " ^| findstr "LISTENING"') do (
  echo Dang giai phong PID %%a tren cong 4012...
  taskkill /F /PID %%a >nul 2>&1
)

echo Hoan tat! Cong 4012 da duoc giai phong hoan toan.
timeout /t 2 >nul
