---
title: Data Model
slug: /developer/data-model
---

# Data Model

## Core enums

- `Role`: `ADMIN`, `USER`
- `Department`: `ENGINEERING`, `EXPERIENCE`
- `LoeStatus`: `DRAFT`, `SUBMITTED`, `APPROVED`, `REOPENED`

## Main entities

### User

Important fields:

- `email`
- `name`
- `role`
- `position`
- `department`
- `reviewerId`
- `country`
- `city`
- `isActive`

### Project

- `name`
- `code`
- `description`
- `isActive`

### FixedCategory

Shared categories that can be logged without a project assignment.

- `name`
- `code`
- `isActive`

### Allocation

Joins a user to a project.

- `userId`
- `projectId`
- `assignedById`
- `percentage`
- `isActive`

Important constraint:

- `@@unique([userId, projectId])`

This prevents duplicate user/project allocation pairs at the database level.

### LoeSheet

One monthly sheet per user.

- `userId`
- `year`
- `month`
- `status`
- `reviewerId`
- `submittedAt`
- `approvedAt`
- `isDelayed`

Important constraint:

- `@@unique([userId, year, month])`

### LoeEntry

Per-day logged hours inside a sheet.

- `loeSheetId`
- `date`
- `projectId` or `fixedCategoryId`
- `hours`
- `note`

## Audit trail

`AuditLog` stores action-level events for administrative operations and workflow tracking.
