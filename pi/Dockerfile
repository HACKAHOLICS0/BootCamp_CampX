node FROM node:18-alpine

# Set working directory in the container
WORKDIR /app

# Copy project files to the container
COPY . .

# Install dependencies with --legacy-peer-deps flag
RUN npm install --legacy-peer-deps

# Expose the frontend port (usually 3000)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
