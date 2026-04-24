---
title: Backend Notes
slug: /developer/backend
---

# Backend Notes

## Stack

- NestJS
- GraphQL code-first schema generation
- Prisma ORM
- PostgreSQL

## Important modules

- `auth`
- `users`
- `projects`
- `allocations`
- `loe`
- `notifications`
- `export`
- `scheduler`

## API entrypoint

- GraphQL endpoint: `http://localhost:3001/graphql`

## Important query and mutation groups

- `me`, `users`, `user`
- `projects`, `allocations`, `fixedCategories`
- `loeSheet`, `loeSheets`, `reviewSheets`, `adminLoeOverview`
- `saveDayEntries`, `submitLoe`, `approveLoe`, `reopenLoe`
- `createUser`, `updateUser`, `deactivateUser`
- `createProject`, `updateProject`, `deactivateProject`
- `createAllocation`, `updateAllocation`, `deactivateAllocation`

## Concurrency note

`LoeSheet(userId, year, month)` has a unique constraint. The service layer already guards the initial create race by catching Prisma `P2002` and reading back the existing sheet when concurrent requests collide.

## Validation direction

LOE save and review behavior is primarily enforced in `backend/src/loe/loe.service.ts`, so when a workflow feels wrong in the UI, check backend sheet and entry rules before changing the frontend alone.
