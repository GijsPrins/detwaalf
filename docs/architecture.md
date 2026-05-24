# Architecture

This document describes the project structure and major technical decisions.

## Stack
- Nuxt 4
- Vue 3
- Supabase
- pnpm

## Structure
- Shared UI components live in /components
- Reusable Vue logic lives in /composables
- Supabase-related files live in /supabase
- Tests live in /test

## Principles
- Keep user-facing flows fast and mobile-first
- Prefer small focused components
- Prefer composables for shared state and behavior
- Avoid large dependencies unless they clearly reduce complexity
