FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl curl

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm install

COPY backend/ ./backend/

RUN cd backend && npx prisma generate

RUN cd backend && ./node_modules/.bin/tsc -p tsconfig.json --noEmit false

RUN ls -la /app/backend/dist/

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/main.js"]