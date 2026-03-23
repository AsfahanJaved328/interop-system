$ErrorActionPreference = "Stop"

$root = "C:\Users\Shakeel Computers\Documents\interop-system"
$frontend = Join-Path $root "frontend"
$releaseRoot = Join-Path $root "release"
$bundleDir = Join-Path $releaseRoot "interop-bundle"
$zipPath = Join-Path $releaseRoot "interop-bundle.zip"

if (Test-Path $bundleDir) {
    Remove-Item -Recurse -Force $bundleDir
}

if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

New-Item -ItemType Directory -Force -Path $bundleDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $bundleDir "backend") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $bundleDir "frontend") | Out-Null

Copy-Item -Path (Join-Path $root "contracts") -Destination (Join-Path $bundleDir "backend\\contracts") -Recurse -Force
Copy-Item -Path (Join-Path $root "scripts") -Destination (Join-Path $bundleDir "backend\\scripts") -Recurse -Force
Copy-Item -Path (Join-Path $root "docs") -Destination (Join-Path $bundleDir "backend\\docs") -Recurse -Force
Copy-Item -Path (Join-Path $root "package.json") -Destination (Join-Path $bundleDir "backend\\package.json") -Force
Copy-Item -Path (Join-Path $root "hardhat.config.js") -Destination (Join-Path $bundleDir "backend\\hardhat.config.js") -Force
Copy-Item -Path (Join-Path $root ".env.example") -Destination (Join-Path $bundleDir "backend\\.env.example") -Force

Copy-Item -Path (Join-Path $frontend "app") -Destination (Join-Path $bundleDir "frontend\\app") -Recurse -Force
Copy-Item -Path (Join-Path $frontend "components") -Destination (Join-Path $bundleDir "frontend\\components") -Recurse -Force
Copy-Item -Path (Join-Path $frontend "lib") -Destination (Join-Path $bundleDir "frontend\\lib") -Recurse -Force
Copy-Item -Path (Join-Path $frontend "stores") -Destination (Join-Path $bundleDir "frontend\\stores") -Recurse -Force
Copy-Item -Path (Join-Path $frontend "package.json") -Destination (Join-Path $bundleDir "frontend\\package.json") -Force
Copy-Item -Path (Join-Path $frontend "next.config.js") -Destination (Join-Path $bundleDir "frontend\\next.config.js") -Force
Copy-Item -Path (Join-Path $frontend "tailwind.config.ts") -Destination (Join-Path $bundleDir "frontend\\tailwind.config.ts") -Force
Copy-Item -Path (Join-Path $frontend "postcss.config.cjs") -Destination (Join-Path $bundleDir "frontend\\postcss.config.cjs") -Force
Copy-Item -Path (Join-Path $frontend "server.js") -Destination (Join-Path $bundleDir "frontend\\server.js") -Force
Copy-Item -Path (Join-Path $frontend ".env.local") -Destination (Join-Path $bundleDir "frontend\\.env.local") -Force

$readme = @"
Interop release bundle

Backend:
- npm install
- npm test
- npm run deploy:local

Frontend:
- npm install
- npm run dev
"@

Set-Content -Path (Join-Path $bundleDir "README.txt") -Value $readme

Compress-Archive -Path (Join-Path $bundleDir "*") -DestinationPath $zipPath -Force
Write-Host "Release bundle created at $zipPath"
