# Sprint 1: Foundation - User Auth, Books, Pages & Tables

## Sprint Goal
Implement the core foundation features for Papyr: user authentication, book management, page management, and basic table creation. This transforms Papyr from a drawing canvas into a functional digital ledger.

## Prerequisites (ALL MET ✅)
- [x] Sprint 0 complete: Drawing engine functional and stable
- [x] Zero-latency rendering engine complete (<16ms latency)
- [x] Stroke data model with pressure simulation
- [x] Undo/redo state management fixed
- [x] Black ink on white canvas working correctly
- [x] Supabase connection configured

## Deliverables
- [ ] User authentication system (sign up, login, logout, profile)
- [ ] Book creation and listing (CRUD operations)
- [ ] Page management within books (add, remove, reorder)
- [ ] Basic table creation on pages (customizable rows/columns)
- [ ] Responsive layout implementation (mobile, tablet, desktop)

## Technical Requirements

### 1. User Authentication System
- Supabase Auth integration
- Sign up page with email/password
- Login page with email/password
- Logout functionality
- Profile page (view/edit user info)
- Protected routes (middleware)
- Session management

### 2. Book Management
- Create book (title, description, cover color)
- List books (grid view with thumbnails)
- View book details
- Delete book (with confirmation)
- Book metadata: createdAt, updatedAt, ownerId

### 3. Page Management
- Add page to book (blank or with template)
- Remove page (with confirmation)
- Reorder pages (drag and drop)
- Page navigation (previous/next)
- Page metadata: pageNumber, bookId, createdAt

### 4. Table Creation
- Insert table on page (specify rows × columns)
- Resize table (drag handles)
- Edit cell content (text input)
- Basic styling (borders, header row)
- Table persistence with page data

### 5. Responsive Layout
- Mobile-first approach
- Sidebar navigation (collapsible on mobile)
- Toolbar adapts to screen size
- Canvas fills available space
- Touch-friendly controls

## Data Models

### User (extends Supabase Auth)
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Book
```typescript
interface Book {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverColor: string;
  createdAt: string;
  updatedAt: string;
}
```

### Page
```typescript
interface Page {
  id: string;
  bookId: string;
  pageNumber: number;
  content: PageContent; // strokes, tables, etc.
  createdAt: string;
  updatedAt: string;
}
```

### Table
```typescript
interface Table {
  id: string;
  pageId: string;
  rows: number;
  columns: number;
  cells: TableCell[][];
  x: number;
  y: number;
  width: number;
  height: number;
}
```

## Testing Requirements
- Unit tests: Auth flow, book/page CRUD, table operations
- Integration tests: Full user journey (signup → create book → add page → draw)
- E2E tests: Multi-device testing (mobile, tablet, desktop)

## Out of Scope
- Cloud synchronization (offline-first comes later)
- Multi-user collaboration
- Advanced table features (formulas, sorting, filtering)
- Export/import (PDF, image, etc.)
- Rich text editing
- Tags/categories for books

## Risks
1. **Supabase Auth complexity**: Email confirmation, password reset flows
   - Mitigation: Use Supabase UI components where possible
2. **Real-time sync conflicts**: Multiple devices editing same book
   - Mitigation: Optimistic UI with conflict resolution (later sprint)
3. **Mobile layout complexity**: Drawing canvas + sidebar + toolbar
   - Mitigation: Progressive enhancement, test early on devices

## Success Criteria
- [ ] Users can sign up, log in, and access their dashboard
- [ ] Users can create, view, and delete books
- [ ] Users can add, remove, and reorder pages within books
- [ ] Users can insert and edit tables on pages
- [ ] Layout works on mobile, tablet, and desktop
- [ ] Drawing engine still works within pages
- [ ] All tests pass (unit, integration, E2E)

## Definition of Done
- Code reviewed and approved
- All tests passing (100% coverage on new code)
- PR merged to develop
- Staging deployment successful
- Product owner sign-off
- Documentation updated

## Story Points: 21
Estimated Sprint Duration: 2 weeks

## Branch Strategy
- **Branch**: `feature/sprint-1-foundation` (from `develop`)
- **PR Target**: `develop`
- **CI Checks**: Build, lint, type-check, tests must pass
- **Merge**: Squash and merge after approval