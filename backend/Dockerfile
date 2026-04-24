FROM node:25-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Use ts-node directly for development/assessment purposes
CMD ["npm", "start"]