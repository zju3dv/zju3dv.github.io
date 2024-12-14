#!/usr/bin/env bash

for f in *.mp4; do
    # 如果文件名中包含 "compressed"，则跳过
    if [[ $f == *"compressed"* ]]; then
        echo "Skipping $f because it already contains 'compressed'"
        continue
    fi

    # 对视频进行压缩，输出文件名加上前缀 "compressed_"
    ffmpeg -i "$f" -vcodec libx264 -crf 23 -preset medium -c:a copy "compressed_$f" -y
done
