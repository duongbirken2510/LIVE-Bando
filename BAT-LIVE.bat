@echo off
chcp 65001 >nul
title Viet Nam Dat Nuoc Ta Oi - Khoi Dong Ung Dung (Port 4012)
cd /d "%~dp0"

if not exist "node_modules" (
    echo Lan dau chay: dang cai thu vien, doi 1-2 phut...
    call npm install
)

:: Neu da co Viet-Nam-Dat-Nuoc-Ta-Oi.exe (tich hop System Tray Guardian + cho Server san sang), chay truc tiep
if exist "%~dp0Viet-Nam-Dat-Nuoc-Ta-Oi.exe" (
    start "" "%~dp0Viet-Nam-Dat-Nuoc-Ta-Oi.exe"
    exit /b 0
)

:: Fallback khi khong co file .exe: chay node truc tiep voi tsx cli.mjs (khong dung Start-Process npx vi npx la .cmd)
netstat -ano | findstr ":4012 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo Dang khoi dong Server Viet Nam Dat Nuoc Ta Oi tren cong 4012...
    if exist "%~dp0runtime\node.exe" (
        start "" /b "%~dp0runtime\node.exe" "%~dp0node_modules\tsx\dist\cli.mjs" "%~dp0server.ts"
    ) else (
        start "" /b node "%~dp0node_modules\tsx\dist\cli.mjs" "%~dp0server.ts"
    )
)

:: Cho Server san sang tren cong 4012 (toi da 15 giay) truoc khi mo cua so App
powershell -NoProfile -Command "$for = 0; while ($for -lt 30) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4012/api/tiktok/status' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { break } } catch {}; Start-Sleep -Milliseconds 400; $for++ }"

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:4012" --start-maximized
    exit /b 0
)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:4012" --start-maximized
    exit /b 0
)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:4012" --start-maximized
    exit /b 0
)
start "" "http://localhost:4012"
