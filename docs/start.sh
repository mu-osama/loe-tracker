#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}        LOE Tracker - Starting Up       ${NC}"
echo -e "${GREEN}========================================${NC}"

# ── 1. Check .env ──────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo -e "${YELLOW}No .env found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  Please fill in your .env values, then re-run this script.${NC}"
    exit 1
  else
    echo -e "${RED}❌ No .env or .env.example found. Please create a .env file.${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✔ .env found${NC}"

# ── 2. Check Node ──────────────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org${NC}"
  exit 1
fi

echo -e "${GREEN}✔ Node.js $(node -v) found${NC}"

# ── 3. Install dependencies ────────────────────────────────────────────────────
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

# ── 4. Run Prisma migrations ───────────────────────────────────────────────────
echo -e "\n${YELLOW}Running database migrations...${NC}"
npm run prisma:migrate --workspace backend

# ── 5. Seed the database (skip if already seeded) ─────────────────────────────
echo -e "\n${YELLOW}Seeding database...${NC}"
npm run prisma:seed --workspace backend || echo -e "${YELLOW}⚠️  Seed skipped or already done.${NC}"

# ── 6. Start backend and frontend ─────────────────────────────────────────────
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Starting backend and frontend...      ${NC}"
echo -e "${GREEN}  Frontend → http://localhost:3000       ${NC}"
echo -e "${GREEN}  Backend  → http://localhost:3001/graphql${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers.${NC}\n"

# Run both in parallel, kill both on Ctrl+C
trap 'echo -e "\n${RED}Shutting down...${NC}"; kill 0' SIGINT SIGTERM

npm run backend &
BACKEND_PID=$!

npm run frontend &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID