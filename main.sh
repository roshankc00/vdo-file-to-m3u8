#!/bin/bash

# Set output paths
outputPath="./output"
hlsPath="${outputPath}/output.m3u8"

# Ensure output directory exists
mkdir -p "$outputPath"

# Run the Node.js script to download the file
exec node index.js

# Check if download was successful
if [ $? -eq 0 ]; then
  # Run FFmpeg to convert to HLS
  ffmpeg -i "downloads/123/videos/Recording 2024-06-26 150550.mp4" \
    -codec:v libx264 -codec:a aac \
    -hls_time 10 -hls_playlist_type vod \
    -hls_segment_filename "${outputPath}/segment%03d.ts" \
    -start_number 0 "${hlsPath}"
else
  echo "Failed to download file, skipping FFmpeg conversion."
fi
