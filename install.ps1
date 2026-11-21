# 날쌤 분필팩 스킬 설치 (Windows PowerShell) — Claude Code 와 Codex 에 한 번에 넣는다.
#   irm https://raw.githubusercontent.com/nalssam/eduAI/main/install.ps1 | iex
# 같은 이름의 스킬이 이미 있으면 지우지 않고 skills 옆 skills-backup-날짜시각 폴더로 옮겨 둔다.
$ErrorActionPreference = 'Stop'
$src = if ($env:BUNPIL_PACK_SRC) { $env:BUNPIL_PACK_SRC } else { 'https://github.com/nalssam/eduAI/archive/refs/heads/main.zip' }
$target = if ($env:BUNPIL_PACK_TARGET) { $env:BUNPIL_PACK_TARGET } else { 'all' }
$dests = switch ($target) {
  'claude' { @("$HOME\.claude\skills") }
  'codex'  { @("$HOME\.agents\skills") }
  default  { @("$HOME\.claude\skills", "$HOME\.agents\skills") }
}
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("bunpil-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  Write-Host '분필팩을 받는 중…'
  $zip = Join-Path $tmp 'pack.zip'
  if (Test-Path $src) { Copy-Item $src $zip } else { Invoke-WebRequest -Uri $src -OutFile $zip -UseBasicParsing }
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  $root = Get-ChildItem -Path $tmp -Directory -Recurse -Depth 1 -Filter 'skills' | Select-Object -First 1
  if (-not $root) { throw '받은 파일에서 skills 폴더를 찾지 못했어요.' }
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $count = 0
  foreach ($dest in $dests) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    foreach ($dir in Get-ChildItem -Path $root.FullName -Directory) {
      if (-not (Test-Path (Join-Path $dir.FullName 'SKILL.md'))) { continue }
      $to = Join-Path $dest $dir.Name
      if (Test-Path $to) {
        $bak = "$dest-backup-$stamp"
        New-Item -ItemType Directory -Path $bak -Force | Out-Null
        Move-Item -Path $to -Destination (Join-Path $bak $dir.Name)
        Write-Host "  이미 있던 $($dir.Name) 은 $bak 로 옮겼어요"
      }
      Copy-Item -Path $dir.FullName -Destination $to -Recurse
      $count++
    }
    Write-Host "넣었어요 → $dest"
  }
  if ($count -eq 0) { throw '넣을 스킬이 없었어요.' }
  Write-Host '끝. Claude Code 나 Codex 를 새로 열고 "날쌤 HTML PPT 로 발표 자료 만들어 줘"라고 해 보세요.'
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
