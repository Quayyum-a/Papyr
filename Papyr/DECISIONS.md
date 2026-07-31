# DECISIONS.md

## Architecture & Technology Decisions

This document records significant architectural, technical, and product decisions made during the development of Papyr. Each decision includes context, alternatives considered, and the outcome.

---

### 1. Technology Stack Selection
**Decision**: Use Next.js 14 with TypeScript, Tailwind CSS, and shadcn/ui for the frontend; Supabase for backend services.

**Context**: 
- Need for a performant, SEO-friendly web application that works well on mobile devices
- Requirement for real-time capabilities and offline-first functionality
- Desire for strong typing and maintainability
- Limited team resources requiring batteries-included solutions

**Alternatives Considered**:
- React Native + Expo: Would provide true native experience but would require maintaining separate codebases for web and mobile, and web access is important for some users
- Vue.js/Nuxt: Strong ecosystem but less familiarity on the team
- Svelte/SvelteKit: Excellent performance but smaller ecosystem and fewer experienced developers
- Plain React + Create React API: Would require more configuration for routing, SSR, etc.

**Outcome**: Selected Next.js 14 for its hybrid rendering capabilities, excellent TypeScript support, built-in routing, and API routes. Tailwind CSS for utility-first styling that pairs well with component-based development. shadcn/ui for accessible, customizable components built on Radix UI. Supabase provides PostgreSQL, authentication, storage, and real-time capabilities in an integrated package.

---

### 2. Drawing Engine Approach
**Decision**: Use HTML5 Canvas with perfect-freehand for stroke smoothing, storing vector points rather than rasterized images.

**Context**:
- Core requirement is natural handwriting feel
- Need for scalability and editability (zoom without quality loss)
- Must support pressure sensitivity and tilt from stylus devices
- Need to minimize storage space for drawings

**Alternatives Considered**:
- SVG paths: Would require complex path manipulation for smooth curves
- Fabric.js: Powerful but heavyweight and over-engineered for our needs
- Pure canvas with manual smoothing: Would require implementing our own smoothing algorithm
- WebGL: Overkill for 2D drawing with complex setup

**Outcome**: Chose HTML5 Canvas for broad browser compatibility and direct pixel control. Selected perfect-freehand for its efficient, mathematically sound ink simulation that produces natural-looking strokes with minimal storage overhead. Store points as JSON arrays in PostgreSQL JSONB fields for flexibility.

---

### 3. State Management Approach
**Decision**: Use Zustand for client-side state and TanStack Query for server state.

**Context**:
- Need to manage complex UI state (tool selection, canvas state, UI visibility)
- Need to handle data fetching, caching, and synchronization with backend
- Want to minimize re-renders and optimize performance
- Prefer minimal boilerplate

**Alternatives Considered**:
- Redux Toolkit: Powerful but verbose with significant boilerplate
- Recoil: Interesting atom-based approach but newer ecosystem
- Jotai: Similar to Zustand but slightly different API
- React Context + useReducer: Would work but requires more manual optimization
- SWR: Similar to TanStack Query but less feature-rich

**Outcome**: Selected Zustand for its minimal API, excellent TypeScript support, and fine-grained reactivity. Selected TanStack Query (formerly React Query) for its excellent data fetching, caching, background updates, and mutation helpers. This separation keeps UI state lightweight while handling complex data synchronization robustly.

---

### 4. Database Schema Approach
**Decision**: Use a normalized relational schema with JSONB fields for flexible attributes.

**Context**:
- Need to store structured data (books, pages, tables) and semi-structured data (strokes, cell content)
- Requirement for efficient querying and indexing
- Need for ACID transactions to maintain data integrity
- Plan to extend schema over time with new features

**Alternatives Considered**:
- Document database (MongoDB): Would sacrifice relational integrity and ACID guarantees for flexibility
- Entity-Attribute-Value (EAV) model: Highly flexible but complex to query and prone to performance issues
- Pure JSONB storage: Would lose relational benefits and make complex queries difficult
- Graph database: Overkill for our hierarchical data structure

**Outcome**: Chose normalized relational structure for core entities (users, books, pages, tables, cells) with foreign key constraints for data integrity. Used JSONB columns for variable-structured data like stroke points and cell content, allowing flexibility while maintaining queryability through GIN indexes. This approach gives us the best of both worlds: relational integrity where needed and flexibility for evolving data structures.

---

### 5. Authentication Strategy
**Decision**: Use Supabase Auth with email/password and OAuth providers.

**Context**:
- Need secure user authentication
- Desire to minimize security implementation burden
- Requirement for social login options (Google, Apple)
- Need for session management and token refresh

**Alternatives Considered**:
- Custom JWT implementation: Would require significant security expertise and ongoing maintenance
- Firebase Auth: Excellent but would lock us into Google ecosystem
- Auth0: Powerful but expensive at scale
- Passport.js with custom DB: Flexible but requires more infrastructure management

**Outcome**: Selected Supabase Auth because it provides a complete authentication solution integrated with our chosen database, includes email/password magic links, OAuth providers, session management, and security best practices out of the box. It reduces our security surface area and leverages Supabase's infrastructure investments.

---

### 6. Offline-First Approach
**Decision**: Implement local-first approach with IndexedDB for offline storage and background sync.

**Context**:
- Core requirement: app must work without internet connection
- Need to sync changes when connectivity returns
- Must handle conflict resolution when same data edited offline on multiple devices
- Want seamless user experience regardless of connection status

**Alternatives Considered**:
- Manual save approach: Users explicitly save before going offline - violates our "no save button" principle
- Server-only with caching: Poor offline experience
- Conflict-free Replicated Data Types (CRDTs): Mathematically sound but complex to implement and may be overkill for our use case
- Operational Transformation (OT): Used in Google Docs but complex and requires central server for transformation logic

**Outcome**: Implement a hybrid approach:
- Local storage: IndexedDB for immediate read/write availability
- Sync queue: Track changes that need to be sent to server
- Background synchronization: Use Service Workers and Background Sync API when available
- Conflict resolution: Last-write-wins with vector clocks for concurrent updates to same field
- User notification: Subtle UI indicators for sync status and conflicts
This approach provides immediate offline capability while leveraging our existing Supabase backend for storage and collaboration.

---

### 7. Deployment Platform
**Decision**: Deploy frontend to Vercel, backend (Supabase) managed separately.

**Context**:
- Need for reliable, scalable hosting with global CDN
- Desire for preview deployments for each pull request
- Requirement for custom domains and SSL
- Want minimal DevOps overhead

**Alternatives Considered**:
- AWS (EC2, S3, CloudFront): Maximum control but significant operational overhead
- Netlify: Similar to Vercel but less optimal for Next.js incremental static regeneration
- Google Cloud Platform: Strong options but more complex setup
- Traditional VPS (DigitalOcean, Linode): Full control but requires server management
- Self-hosted with Docker: Portability but still requires infrastructure management

**Outcome**: Selected Vercel for its seamless Next.js integration, automatic optimizations, preview deployments, edge functions, and generous free tier. Since we're using Supabase as a managed backend, we don't need to host our own server infrastructure. This division of responsibilities allows us to focus on application logic rather than infrastructure management.

---

### 8. Package Manager
**Decision**: Use pnpm for package management.

**Context**:
- Need for fast, efficient dependency installation
- Desire to save disk space in CI/CD environments
- Want deterministic installations
- Experience with npm/yarn workspaces limitations

**Alternatives Considered**:
- npm: Default choice but slower and less efficient hoisting
- Yarn v1: Good performance but Plug'n'Play (v2) had compatibility issues
- Yarn Berry (v2+): Excellent performance but steep learning curve and some ecosystem friction
- pnpm: Fast, disk-efficient, and compatible with most packages

**Outcome**: Selected pnpm for its speed (2-3x faster than npm), disk space efficiency (uses content-addressable storage), and strictness (prevents accidental access to undeclared dependencies). Works well with monorepo structure we may adopt later and has excellent compatibility with Next.js and React ecosystem.

---

### 9. Code Formatting & Linting
**Decision**: Use ESLint with @next/eslint-plugin, Prettier for formatting, and TypeScript for type checking.

**Context**:
- Need for consistent code style across team
- Want to catch errors early in development process
- Desire for automatic formatting to reduce bike-shedding
- Requirement for type safety in our growing codebase

**Alternatives Considered**:
- StandardJS: Opinionated but less flexible
- ESLint alone: Would require manual formatting
- Prettier alone: Would miss logical errors that ESLint catches
- Deno: Interesting but would require abandoning npm ecosystem

**Outcome**: Configured ESLint with Next.js-specific rules for framework best practices, Prettier for consistent formatting, and TypeScript's strict mode for maximum type safety. Added lint-staged and husky to run checks on precommit, ensuring all code meets standards before being committed.

---

### 10. Testing Strategy
**Decision**: Implement unit tests with Vitest, integration tests with Playwright, and visual regression testing with Chromatic.

**Context**:
- Need to ensure reliability as codebase grows
- Want to catch regressions before they reach users
- Desire for fast feedback during development
- Requirement to test both functionality and visual appearance

**Alternatives Considered**:
- Jest: Popular but slower than Vite-based test runners
- Cypress: Excellent end-to-end testing but larger bundle and slower than Playwright
- Selenium: Industry standard but more complex setup and slower execution
- Testing Library: Great philosophy but needs test runner pairing

**Outcome**: Selected Vitest for unit testing due to its speed (built on Vite), excellent React Testing Library integration, and TypeScript support. Selected Playwright for end-to-end testing due to its cross-browser support, powerful API, and excellent tracing capabilities. Added Chromatic for visual regression testing to catch unintended UI changes. This combination provides fast unit tests, comprehensive integration tests, and visual safety nets.

---

### 11. Internationalization (i18n) Approach
**Decision**: Implement i18n using next-i18next with JSON resource files.

**Context**:
- Plan to support multiple languages starting with English
- Need for seamless language switching without page reloads
- Requirement for proper date, number, and currency formatting
- Desire to keep translation files simple and developer-friendly

**Alternatives Considered**:
- Format.js: Powerful but larger bundle size
- react-i18next alone: Would need additional routing integration
- Custom solution: Would reinvent the wheel and likely miss edge cases
- Lingui: Good alternative but less community traction than i18next

**Outcome**: Selected next-i18next (built on i18next) for its excellent Next.js integration, built-in routing support, and mature ecosystem. Using JSON files for translations keeps them simple and editable by non-technical contributors. Plan to implement language detection from browser preferences with fallback to English, and provide a language selector in settings.

---

### 12. Accessibility Implementation
**Decision**: Follow WCAG 2.1 AA standards with additional considerations for motor and cognitive accessibility.

**Context**:
- Legal and ethical obligation to make product accessible
- Target users include older adults who may have age-related impairments
- Drawing interface presents unique accessibility challenges
- Want to exceed minimum standards where possible

**Alternatives Considered**:
- Minimum compliance (WCAG A only): Would exclude many users with disabilities
- After-the-fact remediation: More expensive and less effective than building in accessibility
- Over-reliance on ARIA: Can create more problems than it solves if used incorrectly

**Outcome**: Integrated accessibility from the foundation:
- Semantic HTML elements where possible
- Proper ARIA labels, roles, and properties for custom widgets
- Keyboard navigation for all interactive elements
- Focus management for modals, menus, and dynamic content
- Sufficient color contrast (minimum 4.5:1 for text)
- Scalable UI that works at 200% zoom
- Reduced motion preferences respected
- Special consideration for drawing canvas: provide alternative input methods and adjustable timeouts
- Regular audits with automated (axe) and manual testing including screen reader users

---

### 13. Performance Budget
**Decision**: Establish performance budgets for key metrics.

**Context**:
- Users expect instantaneous response, especially for drawing
- Target users may be on lower-end devices or slow connections
- Poor performance directly impacts core value proposition (feeling like paper)
- Need to quantify and track performance over time

**Metrics & Targets**:
- First Contentful Paint (FCP): < 1.2s on 3G
- Largest Contentful Paint (LCP): < 2.5s on 3G
- First Input Delay (FID): < 100ms
- Time to Interactive (TTI): < 3.5s on 3G
- Total Blocking Time (TBT): < 150ms
- Cumulative Layout Shift (CLS): < 0.1
- Draw latency: < 16ms (60fps) from input to visual feedback
- Bundle size: < 150KB gzipped for initial load

**Implementation**:
- Use Lighthouse CI in CI/CD pipeline to enforce budgets
- Implement performance monitoring in production via Web Vitals
- Set up alerts for budget violations
- Regular performance budget reviews in sprint planning

**Outcome**: These budgets guide optimization efforts throughout development and provide measurable targets for performance excellence.

---

### 14. Security Approach
**Decision**: Implement defense-in-depth with regular security audits.

**Context**:
- Handling potentially sensitive business information
- Need to protect user data and privacy
- Want to build trust with professional users
- Must comply with data protection regulations

**Controls Implemented**:
- **Authentication**: Secure session management via Supabase Auth
- **Authorization**: Row-Level Security (RLS) in PostgreSQL
- **Data Protection**: TLS 1.3 for all communications, encryption at rest via Supabase
- **Input Validation**: Server-side validation for all API endpoints
- **Output Encoding**: Automatic XSS protection in React, careful with dangerouslySetInnerHTML
- **Dependency Management**: Regular audits with npm audit and Dependabot
- **Secrets Management**: Environment variables via Vercel and Supabase secrets
- **API Rate Limiting**: To prevent abuse and DoS attacks
- **Security Headers**: Helmet.js equivalent via Next.js headers
- **Regular Scanning**: Dependabot, npm audit, and periodic penetration testing

**Future Plans**:
- Annual third-party security audit
- Bug bounty program via HackerOne or similar
- Security training for development team
- Incident response plan and regular drills

---

### 15. Data Privacy & Compliance
**Decision**: Design for GDPR compliance from the start, with extensibility for other regulations.

**Considerations**:
- Right to access, rectification, and erasure
- Data portability
- Privacy by design and default
- Lawful basis for processing (consent and legitimate interest)
- Data protection impact assessments for new features

**Implementations**:
- Data minimization: Only collect what's necessary for core functionality
- Purpose limitation: Clear privacy policy explaining data use
- Storage limitation: Configurable retention policies with automatic deletion
- User controls: Export and delete account data
- Data processing agreements: With subprocessors like Supabase
- Data breach procedures: Notification protocols and mitigation plans
- Children's privacy: Not targeting under 13, but implementing safeguards if they appear

**Future**:
- Monitor evolving regulations (CCPA, LGPD, etc.)
- Consider ISO 27001 certification for enterprise customers
- Implement data residency options for regulated industries

---

## Decision Log Format
Future decisions should follow this format:

### [Decision ID]: [Short Title]
**Decision**: [One sentence stating what was decided]
**Context**: [Situation that led to needing this decision]
**Alternatives Considered**: [List of options that were evaluated]
**Outcome**: [Chosen solution and brief rationale]
**Status**: [Proposed, Accepted, Superseded, Rejected]
**Date**: [YYYY-MM-DD]
**Amends**: [Any previous decisions this overrides]
**Tags**: [Area: e.g., architecture, frontend, data, security]

---

## Document Metadata
- Document Version: 1.0.0
- Last Updated: 2026-07-31
- Status: Active