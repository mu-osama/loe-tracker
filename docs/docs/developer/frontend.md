---
title: Frontend Notes
slug: /developer/frontend
---

# Frontend Notes

## Stack

- Next.js 14 App Router
- React 18
- Apollo Client
- custom shared UI components

## Important folders

- `frontend/app/`: route-level screens
- `frontend/components/`: shared UI and LOE components
- `frontend/hooks/`: auth and realtime hooks
- `frontend/lib/`: Apollo config, GraphQL documents, utilities

## Route protection

Protected screens explicitly wrap their content with `RouteGuard`. The docs route is intentionally kept outside that pattern so `/docs` stays reachable without the workspace loading shell.

## CSV export pattern

Large export actions use client-side `papaparse` loaded with dynamic import:

```ts
const Papa = (await import('papaparse')).default;
```

This avoids Next server-bundle chunk issues that occurred with top-level imports.

## Runtime note

This repo had repeated stale `.next` runtime issues in development. When the frontend starts returning loading shells with missing chunks, the reliable recovery path is:

```bash
pkill -f "next dev|next-server|next start"
rm -rf frontend/.next
npm run build --workspace frontend
npm run start --workspace frontend
```
