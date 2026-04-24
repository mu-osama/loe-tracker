---
title: Allocation Management
slug: /admin/allocations
---

# Allocation Management

## Purpose

Allocations connect a user to a project and define the planned percentage split.

## Supported actions

- create allocation
- edit allocation percentage or status
- activate or deactivate allocations
- export filtered allocations as CSV

## Why allocations matter

Allocations drive the user's project rows inside the monthly LOE sheet. Without them, the user cannot follow the intended project-based logging flow.

## Typical flow

1. create the project first
2. create or confirm the user
3. assign the user a reviewer
4. open allocation management
5. connect the user to one or more projects
6. confirm the percentage split reflects the expected workload

## Important implementation note

Duplicate user/project allocations are blocked at the database level with a unique constraint. Existing legacy duplicates were already cleaned up in this project.

## Visible fields

- user
- project
- assigned by
- percentage
- status
