@echo off
REM Update Service Script - Windows Batch
REM Usage: update-database.bat serviceName newSecret secretVersion
REM This script updates the database connection with the new secret

setlocal enabledelayedexpansion

set SERVICE_NAME=%1
set NEW_SECRET=%2
set SECRET_VERSION=%3

echo [DATABASE SERVICE] Updating %SERVICE_NAME% with secret version %SECRET_VERSION%

REM Log the update
echo %DATE% %TIME% - Updating %SERVICE_NAME% >> "C:\logs\secret-rotation.log"

REM Example: Update environment variable or config file
REM set DB_PASSWORD=%NEW_SECRET%

REM Example: Restart the service
REM net stop %SERVICE_NAME%
REM timeout /t 5
REM net start %SERVICE_NAME%

REM Example: Update config file
if exist "C:\config\%SERVICE_NAME%.conf" (
    echo Updating configuration file for %SERVICE_NAME%
    REM Use a PowerShell command or other tool to update the config
    powershell -Command "$content = Get-Content 'C:\config\%SERVICE_NAME%.conf'; $content = $content -replace 'PASSWORD=.*', 'PASSWORD=%NEW_SECRET%'; $content | Set-Content 'C:\config\%SERVICE_NAME%.conf'"
    echo [DATABASE SERVICE] Configuration updated successfully
) else (
    echo [WARNING] Configuration file not found for %SERVICE_NAME%
)

echo [DATABASE SERVICE] Update completed for %SERVICE_NAME%
exit /b 0
