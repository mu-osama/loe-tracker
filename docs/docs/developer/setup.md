---
title: Local Setup
slug: /developer/setup
---

# Developer Setup

## Prerequisites

- Node.js 20+
- npm with workspace support
- PostgreSQL running on `localhost:5432`
- A populated `.env` file in the repository root

## Project structure

```text
loe-tracker/
├── backend/   # NestJS GraphQL API + Prisma
├── frontend/  # Next.js application
├── docs/      # Docusaurus documentation source
└── docker-compose.yml
```

## Install dependencies

```bash
npm install
```

## Database and seed

```bash
npm run prisma:migrate --workspace backend
npm run prisma:seed --workspace backend
```

Current seed credentials:

- `admin@company.com` / `Admin@1234`
- `user@company.com` / `User@1234`

Recommended usage:

- use the **admin** account for management, allocation, and review testing
- use the **user** account for daily entry and month submission testing

The seed is intentionally clean. It deletes existing demo data and creates:

- one admin
- one user with the admin assigned as reviewer
- two sample projects
- shared fixed categories
- two active allocations for the seeded user

It does not preload month history, submissions, or review outcomes.

## Run the services

```bash
npm run backend
npm run frontend
```

Default local endpoints:

- Frontend: `http://localhost:3000`
- Backend GraphQL: `http://localhost:3001/graphql`
- Docs: `http://localhost:3000/docs`

## Docs workspace

Run Docusaurus independently while editing docs:

```bash
npm run docs
```

Build the documentation site:

```bash
npm run docs:build
```

The frontend serves the built static docs output from `docs/build`, so rebuild docs whenever documentation source changes.
