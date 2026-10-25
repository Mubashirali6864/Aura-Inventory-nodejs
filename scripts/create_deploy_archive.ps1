param(
    [string]$DestinationZip = "deploy_cms.zip"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Resolve-Path "$scriptDir\..").Path
$stagingDir = Join-Path $rootDir "deploy_stage"
$zipPath = Join-Path $rootDir $DestinationZip

Write-Host "Cleaning up staging directory..."
if (Test-Path $stagingDir) {
    Remove-Item -Recurse -Force $stagingDir
}
New-Item -ItemType Directory -Path (Join-Path $stagingDir "backend") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stagingDir "dist\assets") -Force | Out-Null

Write-Host "Copying deployment files..."
Copy-Item (Join-Path $rootDir ".env") -Destination $stagingDir
Copy-Item (Join-Path $rootDir "package.json") -Destination $stagingDir
Copy-Item (Join-Path $rootDir "server.js") -Destination $stagingDir
Copy-Item (Join-Path $rootDir "backend\*.js") -Destination (Join-Path $stagingDir "backend")
Copy-Item (Join-Path $rootDir "dist\index.html") -Destination (Join-Path $stagingDir "dist")
Get-ChildItem (Join-Path $rootDir "dist\assets\*") -Exclude "*.bak*", "*_backup", "*.pre-backup-feature" | Copy-Item -Destination (Join-Path $stagingDir "dist\assets")

if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

Write-Host "Compressing archive to $zipPath..."
[System.IO.Compression.ZipFile]::CreateFromDirectory($stagingDir, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()
Start-Sleep -Milliseconds 300
Remove-Item -Recurse -Force $stagingDir -ErrorAction SilentlyContinue

$zipInfo = Get-Item $zipPath
Write-Host "Archive created successfully: $($zipInfo.FullName) ($($zipInfo.Length) bytes)"
