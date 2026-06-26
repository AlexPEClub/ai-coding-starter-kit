#!/usr/bin/env bash
# Download every EP01 Higgsfield clip to ./higgsfield-raw/ via the public CDN.
# Works from any machine with internet (the URLs are public/unsigned).
# Usage:  bash download-higgsfield.sh
set -euo pipefail
cd "$(dirname "$0")"
OUT="higgsfield-raw"; mkdir -p "$OUT"
B="https://d8j0ntlcm91z4.cloudfront.net/user_3F6UVmiDGRtp3TwVQvwWDTHaXmu"

# name | url-filename  (06-25 EP01 production set)
CLIPS=(
"01-intro-crystal|hf_20260625_124233_da0a7bfe-a07a-4893-9e65-e6dd746e54fd.mp4"
"02-binders|hf_20260625_131118_a1d078ef-c04a-470d-ab85-3fb64915abc1.mp4"
"03-matrix|hf_20260625_131126_d5083685-2a59-409b-8e23-857f40740279.mp4"
"04-483-stamp|hf_20260625_132447_277e1481-a753-4b1d-9876-b1110dad7e71.mp4"
"05-blank-page|hf_20260625_132456_2fd642bb-82fb-43fc-9143-4097ebccdfff.mp4"
"06-typing-data|hf_20260625_132505_a1cb2a56-a9e0-429a-8d1e-c40dd4fa5793.mp4"
"07-vmodel|hf_20260625_132513_7a03c56f-acd0-4e44-8c10-2d67f09706fb.mp4"
"08-neural-core|hf_20260625_132521_b6775961-5869-4ea6-85e9-e3f693ed8b9a.mp4"
"09-ems-sensor|hf_20260625_132605_f094361b-e0c0-4f9b-ab52-a158d0805a25.mp4"
"10-risk-warning|hf_20260625_132716_ecf54f93-2092-4739-b924-b48ab70a861c.mp4"
"11-crystal-outro|hf_20260625_132726_8df9ad62-343f-4d4e-bcc5-37944a8179c0.mp4"
# 06-24 earlier brand-tech b-roll (not in the EP01 cut)
"12-follow-button|hf_20260624_172418_2cffcf5d-f615-42e3-a5ff-d482a0762d63.mp4"
"13-edit-timeline|hf_20260624_172413_5d88da68-89e4-4e57-adf9-75ffcbdb75dd.mp4"
"14-doc-writing|hf_20260624_172409_7a93466e-4438-4b6e-955b-949b0492befd.mp4"
"15-desk-to-laptop|hf_20260624_172404_3c76975e-d1fb-439a-a467-f4254618eda2.mp4"
"16-frames|hf_20260624_172238_71dacca9-0fd5-45d8-a00d-17a911292df4.mp4"
"17-waveform|hf_20260624_172231_b3e0ea46-8012-406b-a65d-b95a5ef75c8a.mp4"
)
for c in "${CLIPS[@]}"; do
  name="${c%%|*}"; file="${c##*|}"
  echo "-> $name.mp4"
  curl -fsSL --retry 3 -o "$OUT/$name.mp4" "$B/$file" || echo "   FAILED: $name"
done
echo "Done. Files in ./$OUT/"
