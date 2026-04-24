FROM node:25-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Start Vite server exposing to all network interfaces
CMD ["npm", "run", "dev", "--", "--host"]