FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl curl

WORKDIR /app

# Copy the ENTIRE repo so workspace and all source files are available
COPY . .

# Install all dependencies from root (handles npm workspaces)
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build using tsc directly with explicit output
RUN cd backend && npx tsc --project tsconfig.json --outDir dist --noEmit false

# Confirm dist was built
RUN ls -la /app/backend/dist/ && echo "✅ Build successful"

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/main.js"]