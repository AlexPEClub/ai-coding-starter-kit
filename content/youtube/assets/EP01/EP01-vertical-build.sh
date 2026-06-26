#!/usr/bin/env bash
# Rebuild EP01-short-vertical-72s.mp4 from the committed sources in this folder.
# Requires: ffmpeg (with libx264 + libass) on PATH, and ./fonts/Sora.ttf.
# Run from content/youtube/assets/EP01/ :  bash EP01-vertical-build.sh
set -euo pipefail
cd "$(dirname "$0")"

OUT="EP01-short-vertical-72s.mp4"
VO="EP01-voiceover-julian-72s.mp3"     # full ~72s Julian VO (ElevenLabs)
ASS="EP01-captions-72s.ass"            # burned-in captions (Sora)
W=1080; H=1920; FPS=30

# Timeline: source file | in-point (ss) | duration — sums to ~72.56s (the VO length).
# Old 16:9 clips are centre-cropped to 9:16; new clips are native 9:16 (720x1280).
SRC=(EP01-intro-clip-hero-5s.mp4 \
     broll/EP01-vert-broll-01-483-stamp.mp4 \
     broll/EP01-vert-broll-02-blank-page.mp4 \
     broll/EP01-vert-broll-03-typing-data.mp4 \
     broll/EP01-vert-broll-04-vmodel.mp4 \
     EP01-broll-matrix-5s.mp4 \
     broll/EP01-vert-broll-05-neural-core.mp4 \
     broll/EP01-vert-broll-06-ems-sensor.mp4 \
     EP01-broll-binders-5s.mp4 \
     broll/EP01-vert-broll-07-risk-warning.mp4 \
     broll/EP01-vert-broll-06-ems-sensor.mp4 \
     broll/EP01-vert-broll-08-crystal-outro.mp4)
SS=(0 0 0 0 0 0 0 0 0 0 2.0 0)
DUR=(4.0 5.5 5.5 6.5 6.5 5.0 6.5 6.5 5.0 7.56 6.0 8.0)

VF="scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${FPS},format=yuv420p"

echo "Normalising ${#SRC[@]} segments to ${W}x${H}..."
: > concat.txt
for i in "${!SRC[@]}"; do
  idx=$(printf "%02d" $((i+1)))
  ffmpeg -y -ss "${SS[$i]}" -i "${SRC[$i]}" -t "${DUR[$i]}" -vf "$VF" \
    -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r "$FPS" -an \
    -video_track_timescale 30000 "seg$idx.mp4" >/dev/null 2>&1
  echo "file 'seg$idx.mp4'" >> concat.txt
done

echo "Concatenating..."
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy master_silent.mp4 >/dev/null 2>&1

echo "Burning captions + muxing VO + fades..."
ffmpeg -y -i master_silent.mp4 -i "$VO" \
  -filter_complex "[0:v]subtitles=${ASS}:fontsdir=fonts,fade=t=in:st=0:d=0.5,fade=t=out:st=72.07:d=0.5[v];[1:a]afade=t=in:st=0:d=0.15,afade=t=out:st=72.09:d=0.5[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT"

rm -f seg??.mp4 concat.txt master_silent.mp4
echo "Done -> $OUT"
