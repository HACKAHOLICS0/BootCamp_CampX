FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY pi/package.json ./pi/
COPY piBack/package.json ./piBack/

# Install main project dependencies
RUN npm install

# Install frontend dependencies with --legacy-peer-deps
WORKDIR /app/pi
RUN npm install --legacy-peer-deps

# Install backend dependencies
WORKDIR /app/piBack
RUN npm install

# Return to main directory
WORKDIR /app

# Copy all files
COPY . .

# Create necessary directories
RUN mkdir -p /app/piBack/uploads/videos \
    && mkdir -p /app/piBack/uploads/images \
    && mkdir -p /app/piBack/data/market_insights \
    && mkdir -p /app/piBack/public \
    && mkdir -p /app/piBack/models \
    && mkdir -p /app/piBack/logs \
    && mkdir -p /app/pi/public/models

# Install system dependencies including CMake
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-dev \
    build-essential \
    libx11-dev libatlas-base-dev \
    libgtk-3-dev libboost-python-dev \
    libgl1-mesa-glx libglib2.0-0 \
    python3-opencv \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install CMake from official source
RUN wget https://github.com/Kitware/CMake/releases/download/v3.25.1/cmake-3.25.1-linux-x86_64.sh \
    -q -O /tmp/cmake-install.sh \
    && chmod u+x /tmp/cmake-install.sh \
    && mkdir -p /opt/cmake \
    && /tmp/cmake-install.sh --skip-license --prefix=/opt/cmake \
    && ln -s /opt/cmake/bin/cmake /usr/local/bin/cmake \
    && rm /tmp/cmake-install.sh

# Create Python directory for packages
RUN mkdir -p /app/piBack/python_packages
ENV PYTHONPATH="/app/piBack/python_packages:$PYTHONPATH"

# Install Python dependencies without compiling
RUN pip3 install --no-cache-dir --target=/app/piBack/python_packages \
    numpy pandas scikit-learn tensorflow nltk flask flask-cors \
    beautifulsoup4 requests pillow

# Download NLTK data
RUN python3 -c "import sys; sys.path.append('/app/piBack/python_packages'); import nltk; nltk.download('punkt', download_dir='/app/piBack/python_packages/nltk_data'); nltk.download('stopwords', download_dir='/app/piBack/python_packages/nltk_data'); nltk.download('wordnet', download_dir='/app/piBack/python_packages/nltk_data')"

# Set environment variables for Python
ENV PYTHONPATH="/app/piBack/python_packages:$PYTHONPATH"
ENV NLTK_DATA="/app/piBack/python_packages/nltk_data"

# Build React application with ESLint warnings disabled
WORKDIR /app/pi
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# Set permissions
RUN chmod -R 777 /app/piBack/uploads
RUN chmod -R 777 /app/piBack/public

# Return to main directory
WORKDIR /app

# Create a production start script
RUN echo '#!/bin/bash\n\
# Create necessary directories\n\
mkdir -p /app/piBack/uploads/videos\n\
mkdir -p /app/piBack/uploads/images\n\
mkdir -p /app/piBack/data/market_insights\n\
mkdir -p /app/piBack/public\n\
mkdir -p /app/piBack/models\n\
mkdir -p /app/piBack/logs\n\
\n\
# Set permissions\n\
chmod -R 777 /app/piBack/uploads\n\
chmod -R 777 /app/piBack/public\n\
\n\
# Set environment variables\n\
export NODE_ENV=production\n\
export PORT=${PORT:-5000}\n\
\n\
# Start the application\n\
cd /app/piBack && node app.js\n\
' > /app/start-heroku.sh

RUN chmod +x /app/start-heroku.sh

# Expose the port Heroku will use
EXPOSE $PORT

# Start application
CMD ["/app/start-heroku.sh"]
