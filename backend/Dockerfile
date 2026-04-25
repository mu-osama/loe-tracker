FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl curl

WORKDIR /app

# Copy everything
COPY . .

# Install root dependencies
RUN npm install --legacy-peer-deps

# Install backend dependencies explicitly
RUN cd backend && npm install --legacy-peer-deps

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build
RUN cd backend && npx tsc --project tsconfig.json --noEmit false

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/src/main.js"]