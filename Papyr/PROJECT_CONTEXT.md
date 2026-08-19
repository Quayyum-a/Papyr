# PROJECT CONTEXT

## Current Sprint
Sprint 2 (P301): Ledger Workspace & Handwriting Recognition — IN PROGRESS

## Current Milestone
Ledger workspace core functional; handwriting recognition (OpenRouter) and mobile ledger rendering are open work.

## Completed Sprints

### Sprint 0: Drawing Engine Validation ✅ (2026-08-01)
- Premium ink engine with quadratic bezier tapering
- Velocity-based pressure simulation
- Zero-latency rendering (<16ms) via requestAnimationFrame
- Offscreen canvas compositing
- Multiple pen sizes, natural stroke caps/joins
- Mobile responsive, no scroll

### Sprint 1: Authentication & Foundation ✅ (2026-08-09)
- Supabase Auth (email/password, OAuth, email verification)
- `/auth/callback` route with production URL detection
- Custom branded email templates
- Book CRUD with 8 cover themes (Graphite, Midnight, Forest, Terracotta, Ocean, Amber, Sage, Cream)
- Page management within books
- Dashboard with book shelf view
- Profile page with display name editing
- Fixed: signup email verification redirect (was pointing to localhost)

### Sprint 2 (P301): Ledger Workspace — IN PROGRESS 🚧 (Started 2026-08-07)
- Three-layer canvas system (PaperLayer, GridLayer, InkLayer)
- Cell-bound ink strokes with `cell_id` field
- Editable column headers, cell selection/highlights
- Column management (add/remove/reorder)
- Route: `/dashboard/books/[id]/ledger`
- Supabase integration (load/save pages, debounced save)
- **Open regression**: canvas renders 0×0 on initial load
- **Not yet implemented**: OpenRouter handwriting recognition (`/api/ink/recognize-openrouter`)
- **Not yet implemented**: recognized text persistence to cells

## Architecture Summary

**Drawing Engine Core**
- Canvas2D + custom stroke engine (production-ready)
- Quadratic bezier tapering, Catmull-Rom smoothing
- Velocity-based pressure simulation
- RequestAnimationFrame render loop (16ms latency)
- Offscreen canvas compositing

**Data Layer**
- Supabase PostgreSQL (normalized schema + JSONB for strokes/cells)
- Row-Level Security on all tables
- Offline-first via IndexedDB + background sync (planned)

**Auth Layer**
- Supabase Auth (email/password, Google OAuth)
- Email verification via `/auth/callback`
- Session management with refresh tokens

**UI Layer**
- Next.js 14 App Router, TypeScript, TailwindCSS
- shadcn/ui + Radix UI primitives
- Brand tokens: slate-900 (primary), teal-600 (accent), amber-50 (warm surface)
- Rounded-full inputs/buttons, rounded-2xl cards
- Serif display face for book covers (`font-serif`)

## Current Database Schema (from `supabase/schema.sql` + migrations)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends auth.users) |
| `books` | Ledger notebooks (title, cover_theme, cover_color) |
| `pages` | Pages within books (page_number, content JSONB) |
| `tables` | Grids on pages (rows, columns, cells JSONB) |
| `cells` | Individual cells with content_type ('ink'|'text'|'empty') |

Migrations applied:
- `20260807000000_add_position_and_update_content_structure.sql` — position column, ledger page helper
- `20260808000000_add_title_to_pages.sql` — title field on pages

## Current API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/session` | Current session user |
| `/api/books` | Book CRUD |
| `/api/pages` | Page CRUD |
| `/api/tables` | Table CRUD |
| `/api/cells` | Cell content CRUD |
| `/api/strokes` | Stroke CRUD (cell-bound) |
| `/api/export/[type]` | Export (png, json, svg) |
| `/api/health` | Health check |
| `/api/config` | Public config |
| `/auth/callback` | Supabase email verification |

## Known Open Issues
1. **Ledger canvas zero-dimension regression** — canvas renders 0×0 on initial load
2. **Handwriting recognition not implemented** — OpenRouter route needed
3. **Recognized text storage gap** — need to persist OCR results to cell content
4. **Mobile ledger rendering** — canvas sizing issues on mobile viewport
5. **Low-end device performance** — Sprint 0 carryover (KI-001)

## Folder Structure
```
/src
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Auth pages (login, signup, callback)
│   ├── dashboard/        # Dashboard pages (books, ledger)
│   └── page.tsx          # Freeform canvas (legacy)
├── components/
│   ├── ledger-workspace/ # Ledger canvas + overlay components
│   ├── ui/               # shadcn/ui components
│   └── auth/             # Auth forms
├── hooks/                # Custom React hooks
├── lib/                  # Utilities (ink-engine, supabase, etc.)
└── types/                # TypeScript definitions
```

## Current Branch
`feature/p301-ledger-workspace-handwriting-canvas`

## Deployment Status
- **Production**: https://papyr-app-mu.vercel.app (Vercel)
- **Staging**: Auto-deploy on main branch push
- **Root Directory**: `Papyr` in Vercel settings

---

*Last Updated: 2026-08-16*