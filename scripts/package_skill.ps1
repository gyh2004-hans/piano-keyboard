$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$distRoot = Join-Path $repoRoot 'dist'
$stageRoot = Join-Path $distRoot ('.skill-stage-' + [Guid]::NewGuid().ToString('N'))
$archivePath = Join-Path $distRoot 'piano-keyboard.zip'
. (Join-Path $PSScriptRoot 'copy_skill.ps1')
Push-Location $repoRoot
try { node --test tests/distribution.test.mjs } finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { throw 'Distribution validation failed.' }
New-Item -ItemType Directory -Force (Join-Path $stageRoot 'piano-keyboard') | Out-Null
try {
  Copy-LeanSkill -RepositoryRoot $repoRoot -Destination (Join-Path $stageRoot 'piano-keyboard')
  Compress-Archive -Path (Join-Path $stageRoot 'piano-keyboard') -DestinationPath $archivePath -CompressionLevel Optimal -Force
} finally {
  $resolvedStage = [IO.Path]::GetFullPath($stageRoot)
  if ((Split-Path -Parent $resolvedStage) -ne $distRoot -or -not (Split-Path -Leaf $resolvedStage).StartsWith('.skill-stage-')) { throw 'Unsafe staging path.' }
  Remove-Item -LiteralPath $resolvedStage -Recurse -Force
}
Write-Host "Created bundled-audio $archivePath"
