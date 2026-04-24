---
title: User Flow
slug: /user/flow
---

# User Flow

This page describes the normal month lifecycle for the seeded standard user.

## Login

Use the seeded user account:

- `user@company.com`
- `User@1234`

After login, the user lands in the main application and can access:

- `/dashboard`
- `/loe`

## Step 1: Check the dashboard

The dashboard gives the current month context:

- logged hours
- remaining hours
- days left
- assigned project count
- fixed category count
- month guidance and reviewer context

This is the fastest way to see whether the current month still needs work.

In the default seed, the user already has:

- a reviewer assigned
- sample project allocations
- shared fixed categories available for logging

## Step 2: Open My LOE

Go to `/loe` and choose the target month. The month page is the core user workspace.

## Step 3: Review assigned work buckets

On the month page, the user sees:

- **Assigned Projects vs Logged**
- **Sheet**

The available rows depend on admin setup:

- project allocations
- active shared fixed categories

## Step 4: Enter daily hours

Open a day and record hours against:

- assigned projects
- shared fixed categories

Current behavior:

- drafts can be saved while the month is still editable
- successful draft saves show confirmation feedback
- if the sheet is already submitted or approved, the day is locked
- weekend entry is blocked

## Step 5: Review the month

Before submission, the user should confirm:

- daily totals are correct
- notes are added where needed
- project and shared-category hours look reasonable
- each working day in the month has coverage

CSV export is available for:

- the project comparison section
- the sheet section

## Step 6: Submit the sheet

When the month is complete, the user submits the monthly sheet.

Status flow:

- `DRAFT`: editable
- `SUBMITTED`: locked until reopened by an authorized reviewer
- `REOPENED`: editable again after the sheet is sent back with a comment
- `APPROVED`: closed

## Step 7: Wait for review action

After submission, the assigned reviewer can:

- approve the sheet
- reopen it with a comment

If reopened, the user updates the month and submits again.
