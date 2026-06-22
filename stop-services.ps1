# CodeForge AI Stop Services
$ErrorActionPreference = "Continue"

$ServicesDir = Join-Path $PSScriptRoot "dev-services"
$PgBin = Join-Path $ServicesDir "pgsql\binaries\bin"
$PgData = Join-Path $ServicesDir "pgsql\data"

Write-Host "Stopping PostgreSQL Server..." -ForegroundColor Cyan
& "$PgBin\pg_ctl.exe" -D "$PgData" stop

Write-Host "Stopping Redis Server..." -ForegroundColor Cyan
Stop-Process -Name "redis-server" -ErrorAction SilentlyContinue

Write-Host "All services stopped." -ForegroundColor Green
