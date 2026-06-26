#!/usr/bin/env bash
# Build the music + landscape variants of the EP01 short from committed sources.
# Produces: EP01-music-bed.m4a, EP01-short-vertical-72s.mp4 (with music),
#           EP01-landscape-16x9-72s.mp4 (with music).
# Requires: ffmpeg (libx264 + libass + lavfi) on PATH, ./fonts/Sora.ttf.
# Run from content/youtube/assets/EP01/ :  bash EP01-variants-build.sh
set -euo pipefail
cd "$(dirname "$0")"

VO="EP01-voiceover-julian-72s.mp3"
FPS=30

# ---- 1. Procedural ambient music bed (Cm: C2/G2 drone + Cm triad, tremolo, reverb) ----
echo "Generating ambient music bed..."
ffmpeg -y \
 -f lavfi -i "sine=frequency=65.41:duration=73" \
 -f lavfi -i "sine=frequency=98.00:duration=73" \
 -f lavfi -i "sine=frequency=261.63:duration=73" \
 -f lavfi -i "sine=frequency=311.13:duration=73" \
 -f lavfi -i "sine=frequency=392.00:duration=73" \
 -filter_complex "[0:a]volume=0.50[d0];[1:a]volume=0.32[d1];\
[2:a]volume=0.16[p0];[3:a]volume=0.13[p1];[4:a]volume=0.13[p2];\
[p0][p1][p2]amix=inputs=3:normalize=0[pad];[pad]tremolo=f=0.10:d=0.7[padm];\
[d0][d1][padm]amix=inputs=3:normalize=0[raw];\
[raw]aecho=0.8:0.7:55:0.3,highpass=f=35,lowpass=f=4200,volume=1.15,\
afade=t=in:st=0:d=3,afade=t=out:st=70:d=3,alimiter=limit=0.9[m]" \
 -map "[m]" -ac 1 -ar 44100 -c:a aac -b:a 160k EP01-music-bed.m4a >/dev/null 2>&1

# ---- shared timeline (same as EP01-vertical-build.sh) ----
SRC=(EP01-intro-clip-hero-5s.mp4 \
     broll/EP01-vert-broll-01-483-stamp.mp4 broll/EP01-vert-broll-02-blank-page.mp4 \
     broll/EP01-vert-broll-03-typing-data.mp4 broll/EP01-vert-broll-04-vmodel.mp4 \
     EP01-broll-matrix-5s.mp4 broll/EP01-vert-broll-05-neural-core.mp4 \
     broll/EP01-vert-broll-06-ems-sensor.mp4 EP01-broll-binders-5s.mp4 \
     broll/EP01-vert-broll-07-risk-warning.mp4 broll/EP01-vert-broll-06-ems-sensor.mp4 \
     broll/EP01-vert-broll-08-crystal-outro.mp4)
SS=(0 0 0 0 0 0 0 0 0 0 2.0 0)
DUR=(4.0 5.5 5.5 6.5 6.5 5.0 6.5 6.5 5.0 7.56 6.0 8.0)
LAND=" 0 5 8 "   # indices that are native 16:9 (full-frame); others are 9:16 (pillarbox in landscape)

AUD='[1:a]afade=t=in:st=0:d=0.15,afade=t=out:st=72.09:d=0.5[vo];[2:a]volume=2.0,highpass=f=60[bed];[vo][bed]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]'

build_master () {  # $1=W $2=H $3=mode(vert|land) $4=out
  local W=$1 H=$2 MODE=$3 OUT=$4 list="concat_${MODE}.txt"; : > "$list"
  for i in "${!SRC[@]}"; do
    local idx; idx=$(printf "%02d" $((i+1))); local seg="seg_${MODE}_$idx.mp4"
    if [ "$MODE" = vert ] || [[ "$LAND" == *" $i "* ]]; then
      ffmpeg -y -ss "${SS[$i]}" -i "${SRC[$i]}" -t "${DUR[$i]}" \
        -vf "scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${FPS},format=yuv420p" \
        -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r "$FPS" -an -video_track_timescale 30000 "$seg" >/dev/null 2>&1
    else  # vertical clip into landscape frame -> blurred pillarbox
      ffmpeg -y -ss "${SS[$i]}" -i "${SRC[$i]}" -t "${DUR[$i]}" \
        -filter_complex "[0:v]split=2[bg][fg];[bg]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},gblur=sigma=28,eq=brightness=-0.12[bgb];[fg]scale=-2:${H}[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=${FPS},format=yuv420p[out]" \
        -map "[out]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r "$FPS" -an -video_track_timescale 30000 "$seg" >/dev/null 2>&1
    fi
    echo "file '$seg'" >> "$list"
  done
  ffmpeg -y -f concat -safe 0 -i "$list" -c copy "$OUT" >/dev/null 2>&1
  rm -f seg_${MODE}_??.mp4 "$list"
}

mux () {  # $1=master $2=ass $3=out
  ffmpeg -y -i "$1" -i "$VO" -i EP01-music-bed.m4a \
    -filter_complex "[0:v]subtitles=$2:fontsdir=fonts,fade=t=in:st=0:d=0.5,fade=t=out:st=72.07:d=0.5[v];$AUD" \
    -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -movflags +faststart -shortest "$3"
}

echo "Building vertical (9:16) master + mux with music..."
build_master 1080 1920 vert master_vert.mp4
mux master_vert.mp4 EP01-captions-72s.ass EP01-short-vertical-72s.mp4

echo "Building landscape (16:9) master + mux with music..."
build_master 1920 1080 land master_land.mp4
mux master_land.mp4 EP01-captions-169.ass EP01-landscape-16x9-72s.mp4

rm -f master_vert.mp4 master_land.mp4
echo "Done -> EP01-short-vertical-72s.mp4 (music) + EP01-landscape-16x9-72s.mp4"
