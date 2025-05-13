FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
EXPOSE 5000
CMD ["npm", "start"]
