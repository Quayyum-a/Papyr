# Papyr

Papyr is an offline-first handwritten digital ledger designed to replace physical notebooks for small businesses. It combines the natural simplicity of paper with the reliability and accessibility of digital storage.

## Vision

Make the move from paper to digital feel like switching to a better pen — not learning new software.

## Product Details

- **Type**: Offline-first handwritten digital ledger
- **Primary Users**: Small businesses replacing physical notebooks
- **Core Philosophy**: Paper simplicity, Digital reliability, Offline-first, Fast ink, No feature bloat

## Tech Stack

- **Framework**: Next.js App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS with shadcn/ui
- **Drawing**: Canvas API with perfect-freehand
- **State**: Zustand (client) + TanStack Query (server state)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Architecture

Based on the approved specification (Phases 1-13) with focus on:
- Drawing engine validation (Sprint 0)
- Foundation (Sprint 1)
- Structure (Sprint 2)
- Ink (Sprint 3)
- Offline Sync (Sprint 4)
- Polish (Sprint 5)

## Project Structure

```
/docs/
├── requirements/
├── architecture/
├── database/
├── api/
├── design/
├── decisions/
├── tasks/
├── progress/
├── qa/
├── deployment/
├── changelog/
└── prompts/
```

## Quick Start

1. Initialize repository
2. Install dependencies with pnpm
3. Configure environment variables
4. Run development server

## Status

This repository is set up for the Papyr digital ledger project following the approved specification. All documentation and project context are maintained in the /docs directory.