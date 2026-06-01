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
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
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

$cmdPath = if ($env:ComSpec) { $env:ComSpec } else { "C:\Windows\System32\cmd.exe" }
$cmdArgs = "/d /k cd /d `"$ProjectRoot`" && npm.cmd run dev"
$process = Start-Process -FilePath $cmdPath -ArgumentList $cmdArgs -WorkingDirectory $ProjectRoot -WindowStyle Hidden -PassThru

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
