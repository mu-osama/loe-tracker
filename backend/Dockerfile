FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl curl

WORKDIR /app

# Copy the ENTIRE repo
COPY . .

# Install all dependencies from root (handles npm workspaces)
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build using tsc directly
RUN cd backend && npx tsc --project tsconfig.json --noEmit false

# Show exact location of main.js
RUN find /app/backend/dist -name "main.js"

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/src/main.js"]