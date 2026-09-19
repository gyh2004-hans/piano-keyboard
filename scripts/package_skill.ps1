$ErrorActionPreference = 'Stop'
$skillRoot = Split-Path -Parent $PSScriptRoot
$distRoot = Join-Path $skillRoot 'dist'
$stageRoot = Join-Path $distRoot '.staging'
$archivePath = Join-Path $distRoot 'piano-keyboard.zip'

node (Join-Path $PSScriptRoot 'validate_score.mjs') (Join-Path $skillRoot 'examples/public-domain-score/score.json')
if ($LASTEXITCODE -ne 0) { throw 'Score validation failed.' }
node (Join-Path $PSScriptRoot 'validate_project.mjs') (Join-Path $skillRoot 'examples/generated-app')
if ($LASTEXITCODE -ne 0) { throw 'Project validation failed.' }
Push-Location $skillRoot
try { npm test } finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { throw 'Unit tests failed.' }

New-Item -ItemType Directory -Force $distRoot | Out-Null
$resolvedRoot = [IO.Path]::GetFullPath($skillRoot)
$resolvedStage = [IO.Path]::GetFullPath($stageRoot)
if (-not $resolvedStage.StartsWith($resolvedRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe staging path.' }
if (Test-Path -LiteralPath $stageRoot) { Remove-Item -LiteralPath $stageRoot -Recurse -Force }
New-Item -ItemType Directory -Force (Join-Path $stageRoot 'piano-keyboard') | Out-Null

$excluded = @('node_modules', '.npm-cache', 'dist', 'test-results', 'playwright-report', '.git')
Get-ChildItem -LiteralPath $skillRoot -Force | Where-Object { $excluded -notcontains $_.Name } | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $stageRoot 'piano-keyboard') -Recurse -Force
}
if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath -Force }
Compress-Archive -Path (Join-Path $stageRoot 'piano-keyboard') -DestinationPath $archivePath -CompressionLevel Optimal
Remove-Item -LiteralPath $stageRoot -Recurse -Force
Write-Host "Created $archivePath"
