@echo off
chcp 65001 >nul
title Khoi Dong Viet Nam Dat Nuoc Ta Oi - LIVE-BANDO (Port 4012)
cd /d "%~dp0"

if not exist "node_modules" (
    echo Lan dau chay: dang cai thu vien, doi 1-2 phut...
    call npm install
)

netstat -ano | findstr ":4012 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo Dang khoi dong Server Viet Nam Dat Nuoc Ta Oi tren cong 4012...
    if exist "runtime\node.exe" (
        powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath '%~dp0runtime\node.exe' -ArgumentList '\"%~dp0node_modules\tsx\dist\cli.mjs\" \"server.ts\"' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
    ) else (
        powershell -NoProfile -WindowStyle Hidden -Command "Start-Process npx -ArgumentList 'tsx server.ts' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
    )
    timeout /t 2 /nobreak >nul
)

where msedge >nul 2>&1
if %errorlevel% equ 0 (
    start "" msedge --app="http://localhost:4012" --start-maximized
    exit /b 0
)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:4012" --start-maximized
    exit /b 0
)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:4012" --start-maximized
    exit /b 0
)
start "" "http://localhost:4012"
