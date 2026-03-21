@echo off
REM Revert Service Script - Windows Batch
REM Usage: revert-database.bat serviceName previousSecretVersion

setlocal enabledelayedexpansion

set SERVICE_NAME=%1
set PREVIOUS_VERSION=%2

echo [ROLLBACK] Reverting %SERVICE_NAME% to previous secret version %PREVIOUS_VERSION%

REM Log the revert
echo %DATE% %TIME% - Reverting %SERVICE_NAME% >> "C:\logs\secret-rotation.log"

REM Example: Restore previous configuration from backup
if exist "C:\backups\%SERVICE_NAME%\%PREVIOUS_VERSION%.backup.json" (
    echo Restoring configuration from backup
    copy "C:\backups\%SERVICE_NAME%\%PREVIOUS_VERSION%.backup.json" "C:\config\%SERVICE_NAME%.conf"
    echo [ROLLBACK] Configuration restored successfully
) else (
    echo [ERROR] Backup file not found for %PREVIOUS_VERSION%
    exit /b 1
)

echo [ROLLBACK] Revert completed for %SERVICE_NAME%
exit /b 0
