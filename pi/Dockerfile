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
    && mkdir -p /app/piBack/uploads \
    && mkdir -p /app/piBack/data/market_insights \
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

# Install CMake from official source to ensure it works correctly
RUN wget https://github.com/Kitware/CMake/releases/download/v3.25.1/cmake-3.25.1-linux-x86_64.sh \
    -q -O /tmp/cmake-install.sh \
    && chmod u+x /tmp/cmake-install.sh \
    && mkdir -p /opt/cmake \
    && /tmp/cmake-install.sh --skip-license --prefix=/opt/cmake \
    && ln -s /opt/cmake/bin/cmake /usr/local/bin/cmake \
    && rm /tmp/cmake-install.sh

# Verify CMake installation
RUN cmake --version

# Create Python directory for packages
RUN mkdir -p /app/piBack/python_packages
ENV PYTHONPATH="/app/piBack/python_packages:$PYTHONPATH"

# Install Python dependencies without compiling
RUN pip3 install --no-cache-dir --target=/app/piBack/python_packages \
    numpy pandas scikit-learn tensorflow nltk flask flask-cors \
    beautifulsoup4 requests pillow selenium

# Install dlib with the correct CMake path
ENV PATH="/opt/cmake/bin:${PATH}"
RUN pip3 install --no-cache-dir dlib==19.22.1

# Install face_recognition after dlib is successfully installed
RUN pip3 install --no-cache-dir face_recognition

# Install additional dependencies
RUN pip3 install --no-cache-dir opencv-python-headless face-recognition-models

# Copy installed packages to python_packages directory
RUN cp -r /usr/local/lib/python3.*/dist-packages/dlib* /app/piBack/python_packages/ || echo "dlib copy failed, but continuing"
RUN cp -r /usr/local/lib/python3.*/dist-packages/face_recognition* /app/piBack/python_packages/ || echo "face_recognition copy failed, but continuing"

# Verify installations
RUN python3 -c "import dlib; print('dlib version:', dlib.__version__)"
RUN python3 -c "import face_recognition; print('face_recognition imported successfully')"
RUN python3 -c "import cv2; print('OpenCV version:', cv2.__version__)"

# Download NLTK data
RUN python3 -c "import sys; sys.path.append('/app/piBack/python_packages'); import nltk; nltk.download('punkt', download_dir='/app/piBack/python_packages/nltk_data'); nltk.download('stopwords', download_dir='/app/piBack/python_packages/nltk_data'); nltk.download('wordnet', download_dir='/app/piBack/python_packages/nltk_data')"

# Set environment variables for Python
ENV PYTHONPATH="/app/piBack/python_packages:$PYTHONPATH"
ENV NLTK_DATA="/app/piBack/python_packages/nltk_data"

# Create necessary directories
RUN mkdir -p /app/piBack/models \
    && mkdir -p /app/piBack/logs \
    && mkdir -p /app/piBack/uploads/images \
    && mkdir -p /app/piBack/uploads/videos \
    && mkdir -p /app/piBack/public \
    && chmod -R 777 /app/piBack/uploads

# Build React application with ESLint warnings disabled
WORKDIR /app/pi
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# Expose backend port
EXPOSE 5000

# Return to main directory
WORKDIR /app

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Start application
CMD ["/app/start.sh"]