$ErrorActionPreference = "Stop"

$root = "C:\Users\Shakeel Computers\Documents\interop-system"
$frontend = Join-Path $root "frontend"

Set-Location $root
npm test

Set-Location $frontend
npm run build

Write-Host "Build pack complete. Backend tests + frontend build succeeded."
