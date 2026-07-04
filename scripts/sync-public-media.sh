#!/usr/bin/env bash
# Regénère public/chapters, public/video, public/audio, public/logo depuis le dossier collection local.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COL="$ROOT/COLLECTION 1 NEEL FANG TE DUNDU"

if [[ ! -d "$COL" ]]; then
  echo "Dossier collection introuvable : $COL"
  exit 1
fi

mkdir -p "$ROOT/public/chapters"/ch{1..7} "$ROOT/public/video" "$ROOT/public/audio" "$ROOT/public/logo"

copy_resize() {
  local idx="$1" dir="$2"
  shift 2
  local i=1
  for f in "$@"; do
    local src="$COL/$dir/$f"
    local out="$ROOT/public/chapters/ch${idx}/img${i}.jpg"
    if [[ ! -f "$src" ]]; then
      echo "Manquant : $src"
      exit 1
    fi
    if command -v sips &>/dev/null; then
      sips -Z 1600 "$src" --out "$out" >/dev/null
    else
      cp -f "$src" "$out"
    fi
    echo "OK $out"
    i=$((i + 1))
  done
}

copy_resize 1 "CHAPITRE 1 TAMBALI" IMG_3727.JPG IMG_3730.JPG IMG_3733.JPG IMG_3736.JPG IMG_3739.JPG
copy_resize 2 "CHAPITRE 2" IMG_0594.JPG IMG_0596.JPG IMG_0598.JPG IMG_0600.JPG IMG_0602.JPG
copy_resize 3 "CHAPITRE 3" IMG_2981.JPG IMG_2983.JPG IMG_2985.JPG IMG_2987.JPG IMG_2989.JPG
copy_resize 4 "CHAPITRE 4" DSC01401.JPG DSC01421.JPG DSC01429.JPG DSC01438.JPG DSC01456.JPG
copy_resize 5 "CHAPITRE 5 GE AM" DSC02351.jpg DSC02358.jpg DSC02361.jpg DSC02372.jpg DSC02381.jpg
copy_resize 6 "CHAPITRE 6 RACINE" IMG_3545.jpg IMG_3550.jpg IMG_3558.jpg IMG_3562.jpg IMG_3567.jpg
copy_resize 7 "CHAPITRE 7 MBOUGIR" DSC04267.JPG DSC04269.JPG DSC04273.JPG DSC04275.JPG DSC04277.JPG

cp -f "$COL/LOGO/IMG_8911.PNG" "$ROOT/public/logo/fang-logo-1.png"
cp -f "$COL/LOGO/IMG_8912.PNG" "$ROOT/public/logo/fang-logo-2.png"
cp -f "$COL/LOGO/IMG_8913.PNG" "$ROOT/public/logo/fang-logo-3.png"
cp -f "$COL/LOGO/IMG_8914.PNG" "$ROOT/public/logo/fang-logo-4.png"
cp -f "$COL/MUSIQUE/santtana.mp3" "$ROOT/public/audio/santtana.mp3"

if [[ -f "$COL/VIDEO/FANG VID 1mn_V2.MP4" ]] && command -v ffmpeg &>/dev/null; then
  ffmpeg -y -i "$COL/VIDEO/FANG VID 1mn_V2.MP4" -vf "scale=720:-2" -c:v libx264 -preset medium -crf 27 -pix_fmt yuv420p -movflags +faststart -an "$ROOT/public/video/fang-hero.mp4" -nostats -loglevel warning
  ffmpeg -y -ss 3 -i "$COL/VIDEO/FANG VID 1mn_V2.MP4" -vframes 1 -vf "scale=1280:-2" -q:v 4 "$ROOT/public/video/fang-hero-poster.jpg" -nostats -loglevel warning
  echo "OK vidéo hero compressée"
elif [[ -f "$COL/VIDEO/FANG VID 1mn_V2.MP4" ]]; then
  cp -f "$COL/VIDEO/FANG VID 1mn_V2.MP4" "$ROOT/public/video/fang-hero.mp4"
  echo "ffmpeg absent — vidéo copiée sans compression"
fi

echo "Terminé. Relance le dev server si besoin."
