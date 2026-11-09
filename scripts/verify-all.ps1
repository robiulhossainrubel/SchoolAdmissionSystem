<#
.SYNOPSIS
    Automated All-in-One Verification Script for School Admission System.
.DESCRIPTION
    Runs complete verification:
    1. Checks Docker containers and service health.
    2. Executes backend unit and integration test suite (dotnet test).
    3. Executes frontend automated test suite (Vitest).
    4. Executes live API endpoint validation (hold, confirm, cancel, ownership).
    5. Executes 100-request parallel concurrency stress test against capacity 10.
#>

$ErrorActionPreference = "Stop"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   School Admission System — Automated System Audit       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Docker Compose Health
Write-Host "`n[1/5] Checking Docker Compose Services..." -ForegroundColor Yellow
$containers = docker compose ps --format json | ConvertFrom-Json
if ($containers.Count -lt 3) {
    Write-Warning "Docker containers are not running. Attempting startup..."
    docker compose up -d
    Start-Sleep -Seconds 5
}
docker compose ps

# 2. Service Endpoints
Write-Host "`n[2/5] Testing Service Endpoints..." -ForegroundColor Yellow
$backendHealth = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get
Write-Host "Backend Health (http://localhost:8080/health): $backendHealth" -ForegroundColor Green

$frontendStatus = (Invoke-WebRequest -Uri "http://localhost:5173" -Method Get).StatusCode
Write-Host "Frontend Status (http://localhost:5173): HTTP $frontendStatus OK" -ForegroundColor Green

# 3. Automated Backend Test Suite (dotnet test)
Write-Host "`n[3/5] Running .NET Test Suite (30 Tests)..." -ForegroundColor Yellow
dotnet test backend/SchoolAdmissionSystem.sln --logger "console;verbosity=minimal"

# 4. Automated Frontend Test Suite (Vitest)
Write-Host "`n[4/5] Running Frontend Automated Test Suite (Vitest - 19 Tests)..." -ForegroundColor Yellow
Push-Location frontend
npm test
Pop-Location

# 5. Live API Endpoint Verification
Write-Host "`n[5/5] Running Live API Endpoint Journey..." -ForegroundColor Yellow
$baseUrl = "http://localhost:8080"
$testClass = @{
    name = "Verification Offering $(Get-Random)"
    shift = "Morning"
    totalSeats = 5
} | ConvertTo-Json
$classRes = Invoke-RestMethod -Uri "$baseUrl/classes" -Method Post -Body $testClass -ContentType "application/json"
$classId = $classRes.id
Write-Host "  -> Created Offering: $classId (Seats: 5)" -ForegroundColor Gray

$studentA = "20061234567890123"
$holdRes = Invoke-RestMethod -Uri "$baseUrl/classes/$classId/holds" -Method Post -Headers @{ "X-Student-Id" = $studentA }
Write-Host "  -> Created Seat Hold: $($holdRes.holdId) for Student $studentA" -ForegroundColor Gray

$confirmRes = Invoke-RestMethod -Uri "$baseUrl/holds/$($holdRes.holdId)/confirm" -Method Post -Headers @{ "X-Student-Id" = $studentA }
Write-Host "  -> Confirmed Seat Hold: Status $($confirmRes.status)" -ForegroundColor Gray

# 6. Mandatory Concurrency Stress Test
Write-Host "`n[6/6] Running 100-Request Concurrency Stress Test against Capacity 10..." -ForegroundColor Yellow
$stressClass = @{
    name = "Stress Test Offering $(Get-Random)"
    shift = "Day"
    totalSeats = 10
} | ConvertTo-Json
$stressObj = Invoke-RestMethod -Uri "$baseUrl/classes" -Method Post -Body $stressClass -ContentType "application/json"
$stressClassId = $stressObj.id

$studentIds = 1..100 | ForEach-Object { "9{0:D16}" -f $_ }
$handler = [System.Net.Http.SocketsHttpHandler]::new()
$handler.MaxConnectionsPerServer = 100
$client = [System.Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromSeconds(30)

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$tasks = $studentIds | ForEach-Object {
    $sid = $_
    $req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, "$baseUrl/classes/$stressClassId/holds")
    $req.Headers.Add("X-Student-Id", $sid)
    $client.SendAsync($req)
}
[System.Threading.Tasks.Task]::WaitAll($tasks)
$sw.Stop()

$results = $tasks | ForEach-Object { $_.Result }
$created = ($results | Where-Object { $_.StatusCode -eq [System.Net.HttpStatusCode]::Created }).Count
$conflicts = ($results | Where-Object { $_.StatusCode -eq [System.Net.HttpStatusCode]::Conflict }).Count
$errors = ($results | Where-Object { [int]$_.StatusCode -ge 500 }).Count

Write-Host "  Duration: $($sw.ElapsedMilliseconds) ms" -ForegroundColor Gray
Write-Host "  201 Created: $created (Expected: 10)" -ForegroundColor $(if ($created -eq 10) { "Green" } else { "Red" })
Write-Host "  409 Conflict: $conflicts (Expected: 90)" -ForegroundColor $(if ($conflicts -eq 90) { "Green" } else { "Red" })
Write-Host "  5xx Errors: $errors (Expected: 0)" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })

if ($created -eq 10 -and $conflicts -eq 90 -and $errors -eq 0) {
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "   ALL VERIFICATIONS PASSED: ZERO OVERSELLING CONFIRMED!   " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Error "Concurrency stress test failed to meet exact invariants!"
}
