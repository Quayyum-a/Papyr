# TECH_STACK.md

## Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.4+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui (built on Radix UI)
- **State Management**: 
  - Client State: Zustand
  - Server State: TanStack Query v5
- **Drawing**: 
  - Canvas API
  - perfect-freehand for stroke smoothing
- **Icons**: Lucide React
- **Form Handling**: React Hook Form + Zod validation
- **Date Handling**: date-fns

## Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (email/password, OAuth)
- **Storage**: Supabase Storage (for file uploads, avatars, etc.)
- **Real-time**: Supabase Realtime (WebSocket subscriptions)
- **Edge Functions**: Supabase Edge Functions (for custom backend logic)
- **API Layer**: REST API via Supabase auto-generated endpoints + custom REST routes

## DevOps & Infrastructure
- **Platform**: Vercel (for frontend deployment)
- **CI/CD**: GitHub Actions
- **Package Manager**: pnpm 8+
- **Code Quality**:
  - ESLint with TypeScript plugin
  - Prettier for code formatting
  - TypeScript compiler for type checking
  - Vitest for unit testing
  - Playwright for end-to-end testing
- **Monitoring**:
  - Sentry for error tracking
  - Vercel Analytics for performance
  - Logtail for structured logging

## Development Tools
- **IDE**: VS Code (with recommended extensions)
- **Version Control**: Git (GitHub)
- **API Testing**: Thunder Client / Postman
- **Database**: Supabase Studio
- **Design**: Figma (for UI/UX design)

## Mobile & PWA
- **Progressive Web App**: Built-in Next.js PWA support
- **Mobile Optimizations**: Touch-friendly UI, responsive breakpoints
- **Offline Capabilities**: Service workers for caching static assets

## Security
- **Authentication**: Supabase Auth with JWT
- **Authorization**: Row-Level Security (RLS) policies in PostgreSQL
- **Data Validation**: Zod schema validation on client and server
- **HTTP Security**: Helmet.js via custom middleware
- **Data Encryption**: TLS for all communications, encrypted storage at rest

## Third-Party Services
- **Authentication Providers**: Google, GitHub (via Supabase Auth)
- **Error Tracking**: Sentry
- **Analytics**: Vercel provides built-in analytics and logging
- **Font Hosting**: Google Fonts (Inter)

## Architecture Decisions
See DECISIONS.md for detailed rationale behind technology choices.

## Version
- Document Version: 1.0.0
- Last Updated: 2026-07-31