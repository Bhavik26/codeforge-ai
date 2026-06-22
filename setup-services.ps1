# CodeForge AI Services Setup Script
# Downloads and configures portable PostgreSQL and Redis for local development.

$ErrorActionPreference = "Stop"
$ServicesDir = Join-Path $PSScriptRoot "dev-services"

if (!(Test-Path $ServicesDir)) {
    New-Item -ItemType Directory -Path $ServicesDir | Out-Null
}

# 1. Download and Extract Redis
$RedisZip = Join-Path $ServicesDir "redis.zip"
$RedisDest = Join-Path $ServicesDir "redis"
$RedisUrl = "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"

if (!(Test-Path $RedisZip)) {
    Write-Host "Downloading Redis..." -ForegroundColor Cyan
    curl.exe -L -o $RedisZip $RedisUrl
}

if (!(Test-Path $RedisDest)) {
    Write-Host "Extracting Redis..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $RedisDest | Out-Null
    Expand-Archive -Path $RedisZip -DestinationPath $RedisDest -Force
}

# 2. Download and Extract PostgreSQL
$PgZip = Join-Path $ServicesDir "pgsql.zip"
$PgDest = Join-Path $ServicesDir "pgsql"
$PgUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.3-1-windows-x64-binaries.zip"

if (!(Test-Path $PgZip)) {
    Write-Host "Downloading PostgreSQL (336MB)..." -ForegroundColor Cyan
    curl.exe -L -o $PgZip $PgUrl
}

if (!(Test-Path $PgDest)) {
    Write-Host "Extracting PostgreSQL (this may take a minute)..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $PgDest | Out-Null
    Expand-Archive -Path $PgZip -DestinationPath $PgDest -Force
}

# Define PG path (extraction wraps it inside a 'pgsql' folder)
$PgHome = Join-Path $PgDest "pgsql"
$PgData = Join-Path $PgHome "data"
$PgBin = Join-Path $PgHome "bin"

# 3. Initialize PostgreSQL DB
if (!(Test-Path $PgData)) {
    Write-Host "Initializing PostgreSQL data directory..." -ForegroundColor Cyan
    $InitDbExe = Join-Path $PgBin "initdb.exe"
    & $InitDbExe -D $PgData -U postgres --auth-local=trust --auth-host=trust
}

# 4. Create start-services.ps1
$StartScriptContent = @"
`$ErrorActionPreference = "Continue"

Write-Host "Starting Redis Server..." -ForegroundColor Cyan
Start-Process -FilePath "$RedisDest\redis-server.exe" -NoNewWindow

Write-Host "Starting PostgreSQL Server..." -ForegroundColor Cyan
& "$PgBin\pg_ctl.exe" -D "$PgData" -l "$PgHome\pg_server.log" start

# Wait for database to start up
Start-Sleep -Seconds 3

# Create database if it does not exist
Write-Host "Checking if database 'codeforge_dev' exists..." -ForegroundColor Cyan
& "$PgBin\psql.exe" -U postgres -c "SELECT 1 FROM pg_database WHERE datname='codeforge_dev'" -t | Out-String -OutVariable DbCheck

if (`$DbCheck -match "1") {
    Write-Host "Database 'codeforge_dev' already exists." -ForegroundColor Green
} else {
    Write-Host "Creating database 'codeforge_dev'..." -ForegroundColor Cyan
    & "$PgBin\createdb.exe" -U postgres codeforge_dev
    Write-Host "Database 'codeforge_dev' created successfully!" -ForegroundColor Green
}
"@

$StartScriptPath = Join-Path $PSScriptRoot "start-services.ps1"
Set-Content -Path $StartScriptPath -Value $StartScriptContent
Write-Host "Created start-services.ps1" -ForegroundColor Green

# 5. Create stop-services.ps1
$StopScriptContent = @"
`$ErrorActionPreference = "Continue"

Write-Host "Stopping PostgreSQL Server..." -ForegroundColor Cyan
& "$PgBin\pg_ctl.exe" -D "$PgData" stop

Write-Host "Stopping Redis Server..." -ForegroundColor Cyan
Stop-Process -Name "redis-server" -ErrorAction SilentlyContinue

Write-Host "All services stopped." -ForegroundColor Green
"@

$StopScriptPath = Join-Path $PSScriptRoot "stop-services.ps1"
Set-Content -Path $StopScriptPath -Value $StopScriptContent
Write-Host "Created stop-services.ps1" -ForegroundColor Green

Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host "Run .\start-services.ps1 to start PostgreSQL and Redis." -ForegroundColor Green
