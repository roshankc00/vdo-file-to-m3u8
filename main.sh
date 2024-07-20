#!/bin/bash



outputPath="./output/${TRANSCODED_S3_OBJECT_KEY}"
downloadsPath="downloads"
inputVideo="${downloadsPath}/${S3_OBJECT_KEY}"

mkdir -p "$outputPath"

success=true

download_video() {
  echo "Downloading video..."
  node index.js
  if [ $? -ne 0 ]; then
    echo "Failed to download the video. Exiting."
    success=false
    exit 1
  fi
  echo "Download successful."
}

convert_to_hls() {
  echo "Starting FFmpeg conversion to HLS..."

  declare -A resolutions=(
    ["360p"]="640x360"
    ["420p"]="768x420"
    ["720p"]="1280x720"
    ["1080p"]="1920x1080"
  )
  declare -A bitrates=(
    ["360p"]="800k"
    ["420p"]="1200k"
    ["720p"]="2500k"
    ["1080p"]="5000k"
  )

  for res in "${!resolutions[@]}"; do
    output="${outputPath}/${res}"
    mkdir -p "$output"

    ffmpeg -i "$inputVideo" -vf "scale=${resolutions[$res]}" -c:v libx264 -b:v ${bitrates[$res]} -c:a aac \
      -hls_time 10 -hls_playlist_type vod \
      -hls_segment_filename "${output}/segment%03d.ts" \
      -start_number 0 "${output}/output_${res}.m3u8"
    
    if [ $? -ne 0 ]; then
      echo "Failed to convert to HLS for resolution ${res}."
      success=false
      return
    fi
    
    echo "Generated HLS files for ${res}"
  done

  # Create a master playlist
  masterPlaylist="${outputPath}/master.m3u8"
  echo "#EXTM3U" > "$masterPlaylist"
  for res in "${!resolutions[@]}"; do
    echo "#EXT-X-STREAM-INF:BANDWIDTH=${bitrates[$res]//[a-z]/}000,RESOLUTION=${resolutions[$res]}" >> "$masterPlaylist"
    echo "output_${res}/output_${res}.m3u8" >> "$masterPlaylist"
  done

  echo "HLS conversion completed."
}

upload_to_s3() {
  echo "Uploading HLS files to S3..."
  node uploadtos3.js
  if [ $? -ne 0 ]; then
    echo "Failed to upload HLS files to S3."
    success=false
  else
    echo "Upload to S3 completed successfully."
  fi
}

remove_from_old_bucket() {
  echo "Removing video from old bucket..."
  node removeFromPreviousBucket.js
  if [ $? -ne 0 ]; then
    echo "Failed to remove video from old bucket."
    success=false
  else
    echo "Video removed from old bucket successfully."
  fi
}

cleanup_local_files() {
  echo "Cleaning up local files..."

  if [ -f "${downloadsPath}/${S3_OBJECT_KEY}" ]; then
    rm "${downloadsPath}/${S3_OBJECT_KEY}"
    echo "Deleted downloaded video file: ${downloadsPath}/${S3_OBJECT_KEY}"
  else
    echo "Downloaded video file not found: ${downloadsPath}/${S3_OBJECT_KEY}"
  fi

  if [ -d "$outputPath" ]; then
    rm -rf "$outputPath"/*
    echo "Deleted all files and directories under: $outputPath"
  else
    echo "Output directory not found: $outputPath"
  fi

  echo "Local file cleanup completed."
}

download_video
if [ "$success" = true ]; then
  convert_to_hls
fi
if [ "$success" = true ]; then
  upload_to_s3
fi
if [ "$success" = true ]; then
  remove_from_old_bucket
fi
cleanup_local_files

if [ "$success" = true ]; then
  echo "All operations passed. Running pass.js..."
  node pass.js
else
  echo "Some operations failed. Running fail.js..."
  node fail.js
fi

echo "Script execution completed."