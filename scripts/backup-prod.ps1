param(
  [string]$BackupDirectory = "backups"
)

$ErrorActionPreference = "Stop"

function Assert-CommandAvailable {
  param([string]$CommandName)

  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "Required command '$CommandName' was not found."
  }
}

function New-BackupDirectory {
  param([string]$DirectoryPath)

  if (-not (Test-Path -LiteralPath $DirectoryPath)) {
    New-Item -ItemType Directory -Path $DirectoryPath | Out-Null
  }
}

function Export-HermesDatabase {
  param(
    [string]$ComposeProjectPath,
    [string]$TargetFilePath
  )

  docker compose -f $ComposeProjectPath up -d db-prod | Out-Null

  $dumpCommand = "pg_dump -U postgres --clean --if-exists --no-owner --no-privileges hermes"
  $dumpOutput = & docker compose -f $ComposeProjectPath exec -T db-prod sh -lc $dumpCommand

  if ($LASTEXITCODE -ne 0) {
    throw "Database backup failed."
  }

  [System.IO.File]::WriteAllText($TargetFilePath, ($dumpOutput -join [Environment]::NewLine))
}

function Copy-EnvFileIfPresent {
  param(
    [string]$SourcePath,
    [string]$TargetPath
  )

  if (Test-Path -LiteralPath $SourcePath) {
    Copy-Item -LiteralPath $SourcePath -Destination $TargetPath -Force
  }
}

Assert-CommandAvailable -CommandName "docker"

$projectRoot = Split-Path -Parent $PSScriptRoot
$composeFilePath = Join-Path $projectRoot "docker-compose.yml"

if (-not (Test-Path -LiteralPath $composeFilePath)) {
  throw "Could not find docker-compose.yml at $composeFilePath"
}

$resolvedBackupDirectory = Join-Path $projectRoot $BackupDirectory
New-BackupDirectory -DirectoryPath $resolvedBackupDirectory

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$sqlBackupPath = Join-Path $resolvedBackupDirectory "hermes-prod-$timestamp.sql"
$envBackupPath = Join-Path $resolvedBackupDirectory "env-$timestamp.txt"

Export-HermesDatabase -ComposeProjectPath $composeFilePath -TargetFilePath $sqlBackupPath
Copy-EnvFileIfPresent -SourcePath (Join-Path $projectRoot ".env") -TargetPath $envBackupPath

Write-Host "Backup created:"
Write-Host "  Database: $sqlBackupPath"
if (Test-Path -LiteralPath $envBackupPath) {
  Write-Host "  Environment: $envBackupPath"
}
