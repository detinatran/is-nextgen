#!/usr/bin/env sh
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Generating valid-5s.mp4 (5 seconds, H.264)..."
ffmpeg -y -f lavfi -i testsrc=size=320x240:rate=1 -t 5 -c:v libx264 -pix_fmt yuv420p "$DIR/valid-5s.mp4"

echo "Generating near120.mp4 (118 seconds, H.264)..."
ffmpeg -y -f lavfi -i testsrc=size=320x240:rate=1 -t 118 -c:v libx264 -pix_fmt yuv420p "$DIR/near120.mp4"

echo "Verifying generated files with ffprobe..."
ffprobe -v error -show_entries format=duration,format_name,size "$DIR/valid-5s.mp4"
ffprobe -v error -show_entries format=duration,format_name,size "$DIR/near120.mp4"

echo "All mock media fixtures generated successfully."
