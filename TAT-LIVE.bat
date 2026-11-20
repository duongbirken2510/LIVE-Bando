@echo off
chcp 65001 >nul
title Tat Live & Giai phong Port 3000 - Viet Nam Dat Nuoc Ta Oi (LIVE-BANDO)

echo Dang gui lenh tat mem toi Server Viet Nam Dat Nuoc Ta Oi (Port 3000)...
powershell -NoProfile -Command "try { Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/server/shutdown' -TimeoutSec 3 | Out-Null; Write-Host 'Da gui lenh tat thanh cong!' } catch { Write-Host 'Dang quet tien trinh chiem cong 3000...' }"

timeout /t 1 /nobreak >nul

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING"') do (
  echo Dang giai phong PID %%a tren cong 3000...
  taskkill /F /PID %%a >nul 2>&1
)

echo Hoan tat! Cong 3000 da duoc giai phong hoan toan.
timeout /t 2 >nul
