---
id: intro
title: Project Overview
slug: /
---

# PixelEDGE LOE Tracker

PixelEDGE is a full-stack Level of Effort tracking application for a single organization. It combines a **Next.js frontend**, a **NestJS GraphQL backend**, and a **PostgreSQL database** to manage monthly effort sheets, review actions, allocations, and administrative oversight.

## Who this documentation is for

- **Developers** who need to run, extend, debug, or deploy the project.
- **Users** who log daily hours and submit monthly LOE sheets.
- **Admins** who manage users, projects, allocations, reporting lines, and organization-wide oversight.

## Current application shape

- **Frontend:** Next.js 14 App Router in `frontend/`
- **Backend:** NestJS GraphQL API in `backend/`
- **Database:** PostgreSQL via Prisma schema in `backend/prisma/`
- **Docs:** Docusaurus source in `docs/`, served through the frontend at `/docs`

## Main workflows

1. A user logs in and opens **My LOE** for a month.
2. The user records hours against assigned projects and shared fixed categories.
3. The user submits the monthly sheet.
4. The assigned reviewer opens the review queue and either approves or reopens the sheet.
5. Admin users manage projects, users, allocations, and overview reporting.

## Key route map

- `/dashboard`: personal summary and current month context
- `/loe`: month selector for the user sheet
- `/loe/[year]/[month]`: monthly LOE sheet
- `/review-loe`: review queue
- `/review-loe/[year]/[month]?userId=...`: detailed review page
- `/admin/overview`: admin summary
- `/admin/users`: user management
- `/admin/projects`: project management
- `/admin/allocations`: allocation management
- `/docs`: documentation portal

## Roles

- **USER**: logs hours, tracks monthly progress, submits sheets
- **ADMIN**: full management access, including all admin pages

The application uses only two roles: `USER` and `ADMIN`. Review responsibilities are assigned per user via `reviewerId`, so review capability is workflow-driven rather than a separate role enum.

## Seeded local environment

The default seed intentionally starts clean. It deletes existing LOE demo data and creates:

- one admin account
- one user account
- two sample projects
- shared fixed categories
- allocations that connect the seeded user to the sample projects

That gives you a working admin-to-user flow without preloading submitted, approved, or reopened month history.
