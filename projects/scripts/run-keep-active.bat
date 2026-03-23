@echo off

rem Scheduled task: Keep Supabase active daily
rem Run: Double click or call via Task Scheduler

cd "%~dp0.."
echo Running Supabase keep-alive task...
echo Current directory: %cd%

rem Run script
node scripts/keep-supabase-active.js

if %errorlevel% equ 0 (
    echo Task completed successfully!
) else (
    echo Task failed with error code: %errorlevel%
)

rem Log execution
echo %date% %time% - Task completed, exit code: %errorlevel% >> "logs\keep-supabase-active.log"

echo Task completed, exiting in 3 seconds...
ping 127.0.0.1 -n 3 > nul