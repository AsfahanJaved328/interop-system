$ErrorActionPreference = "Stop"

if (Get-Command forge -ErrorAction SilentlyContinue) {
    Write-Host "Foundry is already installed."
    exit 0
}

Write-Host "Installing Foundry..."
Invoke-Expression (Invoke-WebRequest -Uri "https://foundry.paradigm.xyz" -UseBasicParsing).Content
Write-Host "Installation script complete. Run 'foundryup' in a new terminal to finish."
