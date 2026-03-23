$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$envFile = Join-Path $root ".env"
$frontendEnv = Join-Path $frontend ".env.testnet"

Write-Host "Interop testnet preflight" -ForegroundColor Cyan
Write-Host "Root: $root"

if (!(Test-Path $envFile)) {
  Write-Host "Missing root .env file. Create it from .env.example before deploying." -ForegroundColor Yellow
  exit 1
}

$envContent = Get-Content $envFile -Raw
$required = @("TESTNET_RPC_URL", "TESTNET_PRIVATE_KEY")
$missing = @()

foreach ($key in $required) {
  if ($envContent -notmatch "(?m)^$key=.+") {
    $missing += $key
  }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing required values in .env:" -ForegroundColor Yellow
  $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
  exit 1
}

Write-Host "Root env looks ready." -ForegroundColor Green

if (Test-Path $frontendEnv) {
  Write-Host "Existing frontend testnet env found: $frontendEnv" -ForegroundColor Green
} else {
  Write-Host "frontend/.env.testnet will be created during deployment." -ForegroundColor Yellow
}

Write-Host "Next safe steps:" -ForegroundColor Cyan
Write-Host "  1. npm run deploy:testnet:full"
Write-Host "  2. npm run promote:testnet-env"
Write-Host "  3. cd frontend ; npm run build"
