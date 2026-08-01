# TASKS.md

## Sprint 0: Drawing Engine Validation

| ID | Title | Description | Dependencies | Status | Priority | Estimate | Owner | Acceptance Criteria |
|----|-------|-------------|--------------|--------|----------|----------|-------|---------------------|
| T001 | Set up project repository structure | Initialize git repo, create README, .gitignore, and basic folder structure | None | DONE | High | 1h | AI | Repository initialized with README, .gitignore, and docs folder structure |
| T002 | Initialize documentation framework | Create all required documentation files in /docs subdirectories and root | T001 | DONE | High | 1h | AI | All required docs files exist with appropriate placeholders |
| T003 | Create project README.md | Add project overview, tech stack, and quick start guide | T001 | DONE | High | 0.5h | AI | README.md contains project name, description, tech stack, and setup instructions |
| T004 | Establish development environment | Install Node.js, Next.js, TypeScript, Tailwind CSS, and perfect-freehand | T001 | DONE | High | 1h | AI | Development environment runs `npm run dev` without errors |
| T005 | Configure Supabase connection | Set up Supabase project, install @supabase/supabase-js, create utility files | T001 | DONE | High | 1h | AI | Supabase client is configured and can be imported in the app |
| T006 | Implement basic canvas rendering with perfect-freehand integration | Create a canvas component that captures pointer input and renders smooth strokes using perfect-freehand | T004 | DONE | High | 3h | AI | Canvas displays smooth lines, supports pointer/pen/touch input, and uses perfect-freehand for smoothing |
| T007 | Create stroke data model | Define TypeScript interfaces for stroke data, including points, pressure, timestamp, and tool metadata | T006 | DONE | High | 2h | AI | Stroke model includes all necessary properties for storage and rendering |
| T008 | Implement basic undo/redo functionality | Add undo/redo stack for strokes with keyboard shortcuts (Ctrl+Z, Ctrl+Y) and UI buttons | T007 | DONE | Medium | 3h | AI | Users can undo and redo strokes, state is preserved across tool changes |
| T009 | Add pressure sensitivity support | Modify stroke capture to use pressure input when available (e.g., Apple Pencil, Wacom) | T006 | DONE | Medium | 2h | AI | Stroke width varies with pressure on supported devices |
| T010 | Test on low-end Android devices | Verify performance and usability on Android devices with limited resources | T006, T009 | TODO | Low | 4h | AI | App maintains 30+ FPS on low-end Android, touch input is responsive |
| T011 | Fix render loop re-creation bug | Remove `strokes` from useEffect dependencies, use ref for stroke access | T006 | DONE | Critical | 2h | AI | Render loop stable, no re-creation on stroke completion |
| T012 | Fix duplicate render callbacks on tool change | Add removeCallback to RenderLoop, proper cleanup in useEffect | T011 | DONE | Critical | 1h | AI | No double rendering when pen size/color changes |
| T013 | Consolidate drawSegment code duplication | Remove duplicate drawSegment from page.tsx, use StrokeRenderer class | T011 | DONE | High | 1h | AI | Single source of truth for segment rendering |
| T014 | Optimize current stroke rendering (tail rendering) | Only process last 20 points for real-time rendering, full smoothing on completion | T011 | DONE | High | 2h | AI | Constant frame time regardless of stroke length |
| T015 | Reduce draw steps for real-time rendering | Use 10 steps for current stroke, 20 steps for completed strokes | T014 | DONE | High | 1h | AI | 2x faster segment rendering during active drawing |

## Sprint 1: Foundation - User Auth, Books, Pages & Tables

### Prerequisites (from Sprint 0)
- [x] Sprint 0 complete: Drawing engine functional and stable
- [x] Zero-latency rendering engine complete (<16ms latency)
- [x] Stroke data model with pressure simulation
- [x] Undo/redo state management fixed
- [x] Black ink on white canvas working correctly
- [x] Supabase connection configured

### Sprint 1 Tasks

| ID | Title | Description | Dependencies | Status | Priority | Estimate | Owner | Acceptance Criteria |
|----|-------|-------------|--------------|--------|----------|----------|-------|---------------------|
| T101 | User authentication system | Implement sign up, login, logout, and profile pages using Supabase Auth | Sprint 0 complete | TODO | High | 8h | AI | Users can create account, log in, log out, and view profile |
| T102 | Book creation and listing | Allow users to create, view, list, and delete books | T101 | TODO | High | 6h | AI | CRUD operations for books work correctly with proper validation |
| T103 | Page management within books | Add ability to add, remove, and reorder pages in a book | T102 | TODO | Medium | 4h | AI | Users can manipulate pages and changes persist |
| T104 | Basic table creation on pages | Allow users to insert tables with customizable rows and columns | T103 | TODO | Medium | 4h | AI | Tables can be added to pages and resized |
| T105 | Responsive layout implementation | Ensure the application works well on mobile, tablet, and desktop | T101-T104 | TODO | High | 6h | AI | Layout adapts to different screen sizes; drawing area is usable on mobile |

## Sprint 2: Advanced Features (Future)