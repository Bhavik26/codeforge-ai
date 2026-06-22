# CodeForge AI Start Services
$ErrorActionPreference = "Continue"

$ServicesDir = Join-Path $PSScriptRoot "dev-services"
$RedisDest = Join-Path $ServicesDir "redis"
$PgBin = Join-Path $ServicesDir "pgsql\binaries\bin"
$PgData = Join-Path $ServicesDir "pgsql\data"
$PgHome = Join-Path $ServicesDir "pgsql"
$PsqlExe = "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe"

# 1. Start Redis Server
Write-Host "Starting Redis Server on port 6379..." -ForegroundColor Cyan
Start-Process -FilePath "$RedisDest\redis-server.exe" -WorkingDirectory $RedisDest -NoNewWindow

# 2. Start PostgreSQL Server on port 5433
Write-Host "Starting PostgreSQL Server on port 5433..." -ForegroundColor Cyan
& "$PgBin\pg_ctl.exe" -D "$PgData" -l "$PgHome\pg_server.log" -o "-p 5433" start

# Wait for services to warm up
Write-Host "Waiting for database to start up..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# 3. Create codeforge_dev database
if (Test-Path $PsqlExe) {
    Write-Host "Checking database 'codeforge_dev' on port 5433..." -ForegroundColor Cyan
    & $PsqlExe -U postgres -d postgres -p 5433 -t -c "SELECT 1 FROM pg_database WHERE datname='codeforge_dev'" | Out-String -OutVariable DbCheck
    
    if ($DbCheck -match "1") {
        Write-Host "Database 'codeforge_dev' already exists." -ForegroundColor Green
    } else {
        Write-Host "Creating database 'codeforge_dev'..." -ForegroundColor Cyan
        & $PsqlExe -U postgres -d postgres -p 5433 -c "CREATE DATABASE codeforge_dev"
        Write-Host "Database 'codeforge_dev' created successfully!" -ForegroundColor Green
    }
} else {
    Write-Host "psql.exe not found at '$PsqlExe'. Please check manually." -ForegroundColor Yellow
}
