$node = "C:\Program Files\nodejs\node.exe"
$script = "C:\All\Project\Vibecode\DeepSeek Harness\scripts\sync-codex-token.mjs"
$log = "C:\All\Project\Vibecode\DeepSeek Harness\notes\codex-token-sync.log"

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command ""[Console]::OutputEncoding=[Text.Encoding]::UTF8; & '$node' '$script' 2>&1 | Out-File -Append -Encoding utf8 '$log'"""
$trigger = New-ScheduledTaskTrigger -Daily -At 09:47
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "DSH Codex Token Sync" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Output "task registered"
Get-ScheduledTask -TaskName "DSH Codex Token Sync" | Select-Object TaskName, State
