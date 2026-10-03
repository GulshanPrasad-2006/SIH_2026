@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0backend"

echo ================================================================
echo   KHADAN RAKSHAK - Backend + Website Launcher
echo ================================================================
echo.

REM ---------------------------------------------------------------
REM 1) Find Python
REM ---------------------------------------------------------------
set "PYTHON="
where py >nul 2>&1
if not errorlevel 1 set "PYTHON=py -3"
if not defined PYTHON (
    where python >nul 2>&1
    if not errorlevel 1 set "PYTHON=python"
)
if not defined PYTHON (
    echo [ERROR] Python was not found.
    echo Install Python 3.10 or newer from python.org and run this file again.
    pause
    exit /b 1
)

echo [OK] Python found: %PYTHON%

REM ---------------------------------------------------------------
REM 2) Make sure the required Python packages exist.
REM    If they are already installed this check is quick and no
REM    download is performed.
REM ---------------------------------------------------------------
%PYTHON% -c "import fastapi,uvicorn,sqlalchemy,pydantic,numpy,pandas,sklearn,xgboost" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Required Python packages are missing.
    echo [INFO] Installing backend requirements - this may take a few minutes...
    %PYTHON% -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo [ERROR] Dependency installation failed.
        echo Please run this launcher from an Internet-connected PC.
        pause
        exit /b 1
    )
)
echo [OK] Backend dependencies are available.

REM ---------------------------------------------------------------
REM 3) Find a free local port. Normally this is 8000. If another
REM    program is using it, try 8001 ... 8010 instead of failing.
REM ---------------------------------------------------------------
set "KHADAN_PORT="
for /l %%P in (8000,1,8010) do (
    if not defined KHADAN_PORT (
        powershell -NoProfile -Command "$c=Get-NetTCPConnection -LocalPort %%P -State Listen -ErrorAction SilentlyContinue; if(-not $c){exit 0}else{exit 1}" >nul 2>&1
        if errorlevel 1 (
            REM Port is occupied; continue to the next one.
        ) else (
            set "KHADAN_PORT=%%P"
        )
    )
)
if not defined KHADAN_PORT (
    echo [ERROR] No free port was found in 8000-8010.
    pause
    exit /b 1
)
set "KHADAN_PORT=%KHADAN_PORT%"
echo [OK] Using local port %KHADAN_PORT%.

REM ---------------------------------------------------------------
REM 4) Start FastAPI and wait until it is actually responding.
REM    Do not open the browser after a fixed 3-second sleep.
REM ---------------------------------------------------------------
echo [INFO] Starting KHADAN RAKSHAK backend...
start "KHADAN RAKSHAK Backend" cmd /k "set KHADAN_PORT=%KHADAN_PORT%&& %PYTHON% run_server.py"

set "READY=0"
for /l %%I in (1,1,30) do (
    if "!READY!"=="0" (
        powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://127.0.0.1:%KHADAN_PORT%/; if($r.StatusCode -eq 200){exit 0}else{exit 1} } catch { exit 1 }" >nul 2>&1
        if not errorlevel 1 set "READY=1"
        if "!READY!"=="0" timeout /t 1 /nobreak >nul
    )
)

if "!READY!"=="1" (
    echo.
    echo ================================================================
    echo   KHADAN RAKSHAK IS RUNNING
    echo   http://127.0.0.1:%KHADAN_PORT%/
    echo ================================================================
    start "" "http://127.0.0.1:%KHADAN_PORT%/"
) else (
    echo.
    echo [ERROR] Backend did not start successfully.
    echo Check the black backend window above for the exact error.
    echo.
    pause
    exit /b 1
)

endlocal
