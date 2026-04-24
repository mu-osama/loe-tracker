---
title: Admin Flow
slug: /admin/flow
---

# Admin Flow

This page describes the main admin lifecycle across setup, management, oversight, and review.

## Login

Use the seeded admin account for admin testing:

- `admin@company.com`
- `Admin@1234`

For end-to-end demos, also use the seeded user account:

- `user@company.com` / `User@1234`

After login, the admin can access:

- `/admin/overview`
- `/admin/users`
- `/admin/projects`
- `/admin/allocations`
- `/review-loe`

## Step 1: Create or maintain users

Go to `/admin/users`.

Admins can:

- create users
- edit user details
- assign reviewers
- activate or deactivate accounts
- export users as CSV

Required fields currently include:

- name
- email
- password on create
- position
- department

For the real flow, a newly created user should also be assigned a reviewer before LOE review can work correctly.

## Step 2: Create or maintain projects

Go to `/admin/projects`.

Admins can:

- create projects
- update project metadata
- activate or deactivate projects
- export project data as CSV

## Step 3: Create allocations

Go to `/admin/allocations`.

Admins connect users to projects with an allocation percentage. This step enables project-based LOE entry for the user.

Current implementation notes:

- duplicate user/project assignments are prevented at the database level
- the table shows `Assigned By`
- allocation data can be exported as CSV

## Step 4: Monitor organization status

Go to `/admin/overview`.

Use this page to:

- monitor submission status
- inspect delayed sheets
- review utilization patterns
- export the current filtered view

## Step 5: End-to-end setup sequence

The practical admin sequence is:

1. login as admin
2. create or confirm the required projects
3. create the target user if the user does not exist yet
4. assign a reviewer to that user
5. create allocations that connect the user to one or more projects
6. ask the user to log and submit LOE
7. return to review the submitted sheet

## Step 6: Review submitted sheets

Go to `/review-loe`.

This is the review queue for monthly sheets assigned to the current account. From there, open the detailed month review page.

Review actions:

- approve a sheet
- reopen a sheet with a comment
- export the assigned review list as CSV

## Step 7: Handle reopened work

If a month needs corrections, reopen it. The user regains edit access, updates the month, and submits it again for review.

## Suggested demo sequence

For a complete walkthrough:

1. Login as admin.
2. Confirm or create the required projects.
3. Confirm the seeded user or create a new user.
4. Assign the reviewer for that user.
5. Create allocations for the user.
6. Login as the user and log time.
7. Submit the month.
8. Return as admin and review it through `/review-loe`.
