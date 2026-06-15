param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

$ErrorActionPreference = "Stop"

function Assert-CommandAvailable {
  param([string]$CommandName)

  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "Required command '$CommandName' was not found."
  }
}

function Resolve-RequiredPath {
  param([string]$PathValue)

  if (-not (Test-Path -LiteralPath $PathValue)) {
    throw "Required file was not found: $PathValue"
  }

  return (Resolve-Path -LiteralPath $PathValue).Path
}

Assert-CommandAvailable -CommandName "docker"

$projectRoot = Split-Path -Parent $PSScriptRoot
$composeFilePath = Join-Path $projectRoot "docker-compose.yml"
$resolvedBackupFile = Resolve-RequiredPath -PathValue $BackupFile

docker compose -f $composeFilePath stop app | Out-Null
docker compose -f $composeFilePath up -d db-prod | Out-Null

Get-Content -LiteralPath $resolvedBackupFile | docker compose -f $composeFilePath exec -T db-prod psql -U postgres -d hermes

if ($LASTEXITCODE -ne 0) {
  throw "Database restore failed."
}

docker compose -f $composeFilePath up -d app | Out-Null

Write-Host "Restore completed from $resolvedBackupFile"
