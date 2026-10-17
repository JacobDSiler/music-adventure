@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'mu-watch\.ps1|mu-watch-hidden\.vbs' -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host ('stopped ' + $_.ProcessId) }; Write-Host 'Music Adventure watcher stopped.'; Start-Sleep 2"
