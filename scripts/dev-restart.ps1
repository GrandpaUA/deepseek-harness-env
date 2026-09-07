# dev-restart.ps1 — перезапустити dev-інстанс (порт 3081), прод (3080) НЕ чіпає.
# Без канарки й відкату: dev сам є полігоном, впав — не шкода.
# Запуск з сесії — через WMI, як safe-restart:
#   Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
#     CommandLine = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "<DSH_HOME>\scripts\dev-restart.ps1"' }
# Лог: <DSH-Dev>\last-dev-restart.log
param(
    [int]$Port = 3081,
    [int]$TimeoutSec = 60
)
$ErrorActionPreference = 'Continue'
$devHome = 'C:\All\Project\Vibecode\DSH-Dev'
$logFile = Join-Path $devHome 'last-dev-restart.log'
"=== dev-restart $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Set-Content $logFile

function Log($msg) {
    Add-Content $logFile $msg
    Write-Host $msg
}

# 1) вбити старий dev, якщо слухає порт
$oldPid = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($oldPid) { Log "[1/3] вбиваю dev PID $oldPid"; Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue; Start-Sleep 2 }
else { Log '[1/3] порт вільний, вбивати нікого' }

# 2) старт
Log '[2/3] стартую dev...'
$proc = Start-Process (Join-Path $devHome 'dsh-web-dev.cmd') -ArgumentList '--no-open' `
    -WorkingDirectory $devHome -PassThru -WindowStyle Hidden

# 3) health check
$deadline = (Get-Date).AddSeconds($TimeoutSec)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 700
    if ($proc.HasExited) { Log "RESULT: FAIL — dev процес впав (exit $($proc.ExitCode))"; exit 1 }
    if (-not (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)) { continue }
    try {
        $r = Invoke-WebRequest "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) {
            Log "[3/3] OK: dev наживо на $Port (PID $($proc.Id))"
            Log 'RESULT: SUCCESS'
            exit 0
        }
    } catch { }
}
Log "RESULT: FAIL — не дочекались HTTP 200 за $TimeoutSec с"
exit 1
