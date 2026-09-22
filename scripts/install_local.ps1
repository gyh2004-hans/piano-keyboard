param(
  [Parameter(Mandatory = $true)]
  [string]$Destination
)

$ErrorActionPreference = 'Stop'
$skillRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$resolvedDestination = [IO.Path]::GetFullPath($Destination)
$destinationLeaf = Split-Path -Leaf $resolvedDestination
$destinationParent = Split-Path -Parent $resolvedDestination

if ($destinationLeaf -ne 'piano-keyboard') {
  throw 'Destination must name the exact piano-keyboard directory.'
}
if (-not (Test-Path -LiteralPath $destinationParent -PathType Container)) {
  throw 'Destination parent must already exist.'
}
if ($resolvedDestination -eq $skillRoot) {
  throw 'Destination cannot be the source piano-keyboard repository.'
}

function Assert-SafeSibling([string]$Path, [string]$Prefix) {
  $resolved = [IO.Path]::GetFullPath($Path)
  if ((Split-Path -Parent $resolved) -ne $destinationParent) { throw 'Unsafe staging or backup parent.' }
  if (-not (Split-Path -Leaf $resolved).StartsWith($Prefix, [StringComparison]::Ordinal)) { throw 'Unsafe staging or backup name.' }
}

$token = [Guid]::NewGuid().ToString('N')
$stageRoot = Join-Path $destinationParent ".piano-keyboard-stage-$token"
$stageSkill = Join-Path $stageRoot 'piano-keyboard'
$backupPath = Join-Path $destinationParent ".piano-keyboard-backup-$token"
Assert-SafeSibling $stageRoot '.piano-keyboard-stage-'
Assert-SafeSibling $backupPath '.piano-keyboard-backup-'

$excluded = @('node_modules', '.npm-cache', 'dist', 'test-results', 'playwright-report', '.git')
$validatorCandidates = @(
  (Join-Path $env:USERPROFILE '.codex\skills\.system\skill-creator\scripts\quick_validate.py'),
  (Join-Path $env:USERPROFILE '.agents\skills\skill-creator\scripts\quick_validate.py')
)
$validator = $validatorCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if (-not $validator) { throw 'Cannot locate the Codex Skill quick validator.' }

try {
  New-Item -ItemType Directory -Force $stageSkill | Out-Null
  Get-ChildItem -LiteralPath $skillRoot -Force | Where-Object { $excluded -notcontains $_.Name } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $stageSkill -Recurse -Force
  }

  python $validator $stageSkill
  if ($LASTEXITCODE -ne 0) { throw 'Staged piano-keyboard Skill validation failed.' }

  if (Test-Path -LiteralPath $resolvedDestination) {
    Move-Item -LiteralPath $resolvedDestination -Destination $backupPath
  }
  try {
    Move-Item -LiteralPath $stageSkill -Destination $resolvedDestination
  } catch {
    if (Test-Path -LiteralPath $backupPath) {
      Move-Item -LiteralPath $backupPath -Destination $resolvedDestination
    }
    throw
  }
  if (Test-Path -LiteralPath $backupPath) {
    Assert-SafeSibling $backupPath '.piano-keyboard-backup-'
    Remove-Item -LiteralPath $backupPath -Recurse -Force
  }
} finally {
  if (Test-Path -LiteralPath $stageRoot) {
    Assert-SafeSibling $stageRoot '.piano-keyboard-stage-'
    Remove-Item -LiteralPath $stageRoot -Recurse -Force
  }
}

Write-Host "Installed validated piano-keyboard Skill to $resolvedDestination"
