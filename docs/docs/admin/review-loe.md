---
title: Review LOE
slug: /admin/review-loe
---

# Review LOE

The review pages are where the assigned reviewer processes submitted monthly sheets.

## Main screens

- `/review-loe`: assigned review queue
- `/review-loe/[year]/[month]?userId=...`: detailed sheet review

## Supported actions

- open assigned sheets
- approve a submitted sheet
- reopen a sheet with a comment
- export the assigned review list as CSV

## How this fits the main flow

Review happens after:

1. an admin creates or confirms the user
2. the user has project allocations and a reviewer assignment
3. the user fills the monthly LOE
4. the user submits the month

Only then does the month appear in the correct review queue.

## What to watch during review

- missing or suspicious hour patterns
- over-utilization
- delayed submissions
- project hours that do not match the expected allocation pattern
