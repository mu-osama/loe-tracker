---
title: Architecture
slug: /developer/architecture
---

# Architecture

## High-level flow

1. The user authenticates against the GraphQL API.
2. The frontend stores the session token and queries `me`.
3. Page-level screens request LOE sheets, allocations, users, projects, and review data over GraphQL.
4. Mutations update the database through NestJS services backed by Prisma.
5. Realtime notifications are exposed through GraphQL subscriptions.

## Frontend responsibilities

The Next.js app owns:

- authentication experience
- route protection for app pages
- dashboards and management screens
- LOE sheet entry and review workflows
- CSV exports for major admin and review screens
- serving the built docs site at `/docs`

## Backend responsibilities

The NestJS API owns:

- auth and JWT session validation
- LOE sheet creation, saving, submission, approval, and reopening
- user, project, and allocation management
- notifications and reminder workflows
- Prisma access and business-rule enforcement

## Data boundaries

- **Users** can have one reviewer and many allocations.
- **Projects** are assigned to users through allocations.
- **Fixed categories** cover shared non-project time buckets.
- **LoeSheet** is the monthly parent record.
- **LoeEntry** stores per-day hours tied to either a project or a fixed category.

## Documentation delivery model

The docs source lives in `docs/` as a standard Docusaurus workspace. The built static output is served by the Next.js frontend through a catch-all route under `/docs`, which keeps documentation on the same host and base URL as the product UI.
