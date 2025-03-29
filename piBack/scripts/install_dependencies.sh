#!/bin/bash

# Install FFmpeg
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    brew install ffmpeg
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    # Linux
    sudo apt-get update
    sudo apt-get install -y ffmpeg
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
    # Windows
    echo "Please install FFmpeg manually from https://ffmpeg.org/download.html"
fi

# Install Whisper
pip install openai-whisper

# Install Node.js dependencies
npm install fluent-ffmpeg natural 