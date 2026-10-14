function Copy-LeanSkill([string]$RepositoryRoot, [string]$Destination) {
  $source = Join-Path $RepositoryRoot 'skills/piano-keyboard'
  # Allowlist shared by local installation and ZIP packaging. Include the complete pinned audio library.
  $entries = @('SKILL.md', 'LICENSE', 'agents', 'references', 'schemas', 'scripts', 'assets/audio', 'examples/audio-preview', 'assets/salamander/source.json', 'assets/salamander/manifest.json', 'assets/salamander/ATTRIBUTION.md', 'assets/salamander/upstream')
  foreach ($entry in $entries) {
    $target = Join-Path $Destination $entry
    New-Item -ItemType Directory -Force (Split-Path -Parent $target) | Out-Null
    Copy-Item -LiteralPath (Join-Path $source $entry) -Destination $target -Recurse -Force
  }
}
