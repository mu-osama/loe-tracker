---
title: Operations and Maintenance
slug: /developer/operations
---

# Operations and Maintenance

## Common commands

```bash
npm run build --workspace backend
npm run build --workspace frontend
npm run docs:build
```

## Keep docs current

Any time you change:

- roles or permissions
- admin pages
- LOE workflow rules
- data model or seed behavior
- environment/setup instructions

update the relevant markdown file in `docs/docs/` and rebuild with `npm run docs:build`.

## Local verification

Recommended checks after docs changes:

```bash
npm run build --workspace docs
npm run build --workspace frontend
curl -I http://localhost:3000/docs
```

## Current seed state

The current seed creates:

- one admin
- one user account
- projects, allocations, and fixed categories
- no preloaded LOE sheets, notifications, or audit history
