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

## Sprint 1: Foundation (Future)

| ID | Title | Description | Dependencies | Status | Priority | Estimate | Owner | Acceptance Criteria |
|----|-------|-------------|--------------|--------|----------|----------|-------|---------------------|
| T101 | User authentication system | Implement sign up, login, logout, and profile pages using Supabase Auth | None | TODO | High | 8h | AI | Users can create account, log in, log out, and view profile |
| T102 | Book creation and listing | Allow users to create, view, list, and delete books | T101 | TODO | High | 6h | AI | CRUD operations for books work correctly with proper validation |
| T103 | Page management within books | Add ability to add, remove, and reorder pages in a book | T102 | TODO | Medium | 4h | AI | Users can manipulate pages and changes persist |
| T104 | Basic table creation on pages | Allow users to insert tables with customizable rows and columns | T103 | TODO | Medium | 4h | AI | Tables can be added to pages and resized |
| T105 | Responsive layout implementation | Ensure the application works well on mobile, tablet, and desktop | T101-T104 | TODO | High | 6h | AI | Layout adapts to different screen sizes; drawing area is usable on mobile |
| T106 | Personalized post-signup verification modal | Replace the native `alert()` shown after signup with an in-product, branded, personalized modal | T101 | TODO | Medium | 3h | AI | No `window.alert` fires in the verification-required signup path; a branded modal renders, addresses the user by name/email, and its primary action navigates to `/auth/login`; existing SignUpForm tests still pass; new tests cover the modal |
