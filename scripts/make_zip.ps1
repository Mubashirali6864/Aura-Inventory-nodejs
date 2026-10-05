Add-Type -AssemblyName System.IO.Compression.FileSystem

$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$staging = Join-Path $rootDir "tmp\staging_cms"
$zipPath = Join-Path $rootDir "deploy_cms.zip"

if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
$item = Get-Item $zipPath
Write-Host "Success: $($item.FullName) ($($item.Length) bytes)"
