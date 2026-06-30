param(
  [int]$Port = 3000,
  [int]$TimeoutSeconds = 20
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Url = "http://localhost:$Port/"

function Test-FluidDevServer {
  try {
    $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 3
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  } catch {
    return $false
  }
}

if (Test-FluidDevServer) {
  Write-Host "RUNNING $Url"
  exit 0
}

# Windows can expose both Path and PATH in inherited environments. PowerShell's
# Start-Process treats that as duplicate keys, so normalize it before launching.
$pathValue = cmd.exe /d /c echo %Path%
[Environment]::SetEnvironmentVariable("PATH", $null, "Process")
[Environment]::SetEnvironmentVariable("Path", $pathValue, "Process")

$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$nextPath = Join-Path $ProjectRoot "node_modules\next\dist\bin\next"
$outLog = Join-Path $ProjectRoot ".dev-server.out.log"
$errLog = Join-Path $ProjectRoot ".dev-server.err.log"

$nodeArgs = "`"$nextPath`" dev -H 0.0.0.0 -p $Port"
$process = Start-Process `
  -FilePath $nodePath `
  -ArgumentList $nodeArgs `
  -WorkingDirectory $ProjectRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog `
  -PassThru

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
do {
  Start-Sleep -Milliseconds 500

  if (Test-FluidDevServer) {
    Write-Host "STARTED pid=$($process.Id) $Url"
    exit 0
  }

  if ($process.HasExited) {
    throw "Dev server process exited before $Url responded."
  }
} while ((Get-Date) -lt $deadline)

throw "Dev server did not respond at $Url within $TimeoutSeconds seconds."
