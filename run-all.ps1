# CodeForge AI Start Services & App
$ErrorActionPreference = "Stop"

# 1. Start Database & Redis
Write-Host "=============================" -ForegroundColor Green
Write-Host "1. Starting PostgreSQL & Redis" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
powershell -ExecutionPolicy Bypass -File .\start-services.ps1

# Wait a bit
Start-Sleep -Seconds 2

# 2. Run Prisma Migrations
Write-Host "=============================" -ForegroundColor Green
Write-Host "2. Running Database Migrations" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Set-Location -Path "apps/backend"
npx prisma migrate dev --name init

# 3. Start Backend Server
Write-Host "=============================" -ForegroundColor Green
Write-Host "3. Starting Backend Dev Server" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
npm run dev
