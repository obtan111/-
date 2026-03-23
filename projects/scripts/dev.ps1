# PowerShell version of dev.sh for Windows

$PORT = 5000
$NODE_ENV = "development"
$DEPLOY_RUN_PORT = 5000

Write-Host "Clearing port $PORT before start."

# Kill process using the port if any
try {
    $processes = netstat -ano | Select-String ":$DEPLOY_RUN_PORT"
    if ($processes) {
        foreach ($process in $processes) {
            $pid = $process.ToString().Split(' ')[-1]
            if ($pid -match '^\d+$') {
                Write-Host "Killing process $pid using port $DEPLOY_RUN_PORT"
                taskkill /F /PID $pid 2>$null
            }
        }
        Start-Sleep -Seconds 1
    } else {
        Write-Host "Port $DEPLOY_RUN_PORT is free."
    }
} catch {
    Write-Host "Error checking port: $($_.Exception.Message)"
}

Write-Host "Starting HTTP service on port $PORT for dev..."

# Start Next.js dev server
npx next dev --port $PORT