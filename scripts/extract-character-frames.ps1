# Extrait des images depuis les clips 3D personnages (turntable ~10s).
param(
  [string]$SourceDir = "c:\Users\DIAO\Downloads\fang-site-main\fang-site-main\_video_extract",
  [string]$OutputDir = "c:\Users\DIAO\Downloads\fang-site-main\fang-site-main\public\collection\s01\_3d-renders",
  [int]$FrameCount = 12,
  [int]$MaxWidth = 1800
)

$ffmpeg = "c:\Users\DIAO\Downloads\fang-site-main\fang-site-main\node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe"
if (-not (Test-Path $ffmpeg)) {
  throw "ffmpeg introuvable: $ffmpeg"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$clips = Get-ChildItem $SourceDir -Filter "Clip 1(*).mp4" | Sort-Object { [int]($_.BaseName -replace '.*\((\d+)\).*','$1') }
if ($clips.Count -eq 0) { throw "Aucun clip trouvé dans $SourceDir" }

$manifest = @()
foreach ($clip in $clips) {
  $index = [int]($clip.BaseName -replace '.*\((\d+)\).*','$1')
  $slug = "clip-{0:D2}" -f $index
  $out = Join-Path $OutputDir $slug
  New-Item -ItemType Directory -Force -Path $out | Out-Null

  $pattern = Join-Path $out "frame-%02d.png"
  $vf = "fps=$FrameCount/10,scale=$MaxWidth`:-1:flags=lanczos"

  Write-Host ">> $slug <- $($clip.Name)"
  & $ffmpeg -y -i $clip.FullName -vf $vf -frames:v $FrameCount $pattern 2>$null

  $frames = Get-ChildItem $out -Filter "frame-*.png" | Sort-Object Name
  $cover = Join-Path $out "cover.png"
  if ($frames.Count -gt 0) {
    $mid = $frames[[math]::Floor($frames.Count / 2)]
    Copy-Item $mid.FullName $cover -Force
  }

  $manifest += [pscustomobject]@{
    clip = $index
    slug = $slug
    source = $clip.Name
    frames = $frames.Count
    cover = "collection/s01/_3d-renders/$slug/cover.png"
  }
}

$manifest | ConvertTo-Json -Depth 3 | Set-Content (Join-Path $OutputDir "manifest.json") -Encoding UTF8
Write-Host "Terminé: $($clips.Count) clips, $($manifest.frames | Measure-Object -Sum | Select-Object -ExpandProperty Sum) images."
