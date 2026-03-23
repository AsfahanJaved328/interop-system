$ErrorActionPreference = "Stop"

$root = "C:\Users\Shakeel Computers\Documents\interop-system"
$frontend = Join-Path $root "frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:APPDATA='C:\Users\Shakeel Computers\Documents\interop-system\.hardhat-home'; `$env:LOCALAPPDATA='C:\Users\Shakeel Computers\Documents\interop-system\.hardhat-home'; cd `"$root`"; npx.cmd hardhat node"
Start-Sleep -Seconds 8

Set-Location $root
npm run deploy:local
npm run deploy:adapters

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$frontend`"; npm run dev"

Write-Host "Dev stack started: Hardhat node + frontend dev server."
