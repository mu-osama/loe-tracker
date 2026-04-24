# LOE Tracker

Full-stack Level of Effort tracking app:

- `frontend`: Next.js 14 App Router
- `backend`: NestJS GraphQL API with Prisma/PostgreSQL
- `docs`: Docusaurus documentation for developers, users, and admins
- `docker-compose.yml`: local orchestration for Postgres, backend, and frontend

## Local workspace start

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL on port `5432`.
3. Install dependencies:
   `npm install`
4. Apply the schema and seed demo data:
   `npm run prisma:migrate --workspace backend`
   `npm run prisma:seed --workspace backend`
5. Start the apps:
   `npm run backend`
   `npm run frontend`

Frontend runs on `http://localhost:3000`.
Backend GraphQL runs on `http://localhost:3001/graphql`.
Documentation runs inside the frontend at `http://localhost:3000/docs`.

## Documentation

- Edit source files in `docs/docs/`
- Run the docs workspace locally with:
  `npm run docs`
- Build static docs with:
  `npm run docs:build`

The built Docusaurus output is served by the frontend route handler at `/docs`.

## Docker start

1. Copy `.env.example` to `.env`.
2. Run:
   `docker compose up --build`

Docker Compose uses the `postgres` service hostname internally, so it overrides the backend `DATABASE_URL` automatically.

## Seed credentials

- `admin@company.com` / `Admin@1234`
- `user@company.com` / `User@1234`

The seed resets the database and creates:

- one admin
- one user assigned to the admin as reviewer
- two sample projects
- three fixed categories
- two active allocations for the seeded user
