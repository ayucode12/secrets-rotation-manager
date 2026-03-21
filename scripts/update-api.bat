@echo off
REM Update Service Script - Windows Batch
REM Usage: update-api-gateway.bat serviceName newSecret secretVersion

setlocal enabledelayedexpansion

set SERVICE_NAME=%1
set NEW_SECRET=%2
set SECRET_VERSION=%3

echo [API SERVICE] Updating %SERVICE_NAME% with secret version %SECRET_VERSION%

REM Log the update
echo %DATE% %TIME% - Updating %SERVICE_NAME% API Service >> "C:\logs\secret-rotation.log"

REM Example: Update configuration
if exist "C:\api\%SERVICE_NAME%\config.json" (
    echo Updating API configuration for %SERVICE_NAME%
    powershell -Command "$json = Get-Content 'C:\api\%SERVICE_NAME%\config.json' | ConvertFrom-Json; $json.apiKey = '%NEW_SECRET%'; $json | ConvertTo-Json | Set-Content 'C:\api\%SERVICE_NAME%\config.json'"
    echo [API SERVICE] Configuration updated
) else (
    echo [WARNING] API configuration not found for %SERVICE_NAME%
)

echo [API SERVICE] Update completed for %SERVICE_NAME%
exit /b 0
