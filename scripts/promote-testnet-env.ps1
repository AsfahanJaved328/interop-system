$source = Join-Path $PSScriptRoot "..\frontend\.env.testnet"
$target = Join-Path $PSScriptRoot "..\frontend\.env.local"

if (!(Test-Path $source)) {
  Write-Error "Missing $source. Run npm run deploy:testnet:full first."
  exit 1
}

Copy-Item $source $target -Force
Write-Host "Promoted .env.testnet to .env.local"
