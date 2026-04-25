FROM node:20-alpine

WORKDIR /app

# Copy root package files (needed for npm workspaces)
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install all dependencies
RUN npm install

# Copy backend source
COPY backend/ ./backend/

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build NestJS
RUN cd backend && npm run build

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/main.js"]