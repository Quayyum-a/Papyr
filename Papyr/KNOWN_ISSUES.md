# KNOWN_ISSUES.md

## Known Issues

This document tracks known issues in the Papyr application that have been identified but not yet resolved. Issues are prioritized based on impact and severity.

### Format
Each issue follows this format:
- **ID**: Unique identifier (KI-XXX)
- **Title**: Brief description
- **Status**: Open, In Progress, Review, or Closed
- **Priority**: Critical, High, Medium, Low
- **Component**: Affected subsystem
- **Description**: Detailed explanation
- **Steps to Reproduce** (if applicable)
- **Impact**: Effect on users or system
- **Workaround** (if available)
- **Assignee**: Team member responsible
- **Due Date**: Target resolution date
- **Tags**: Relevant labels (e.g., performance, usability, bug)

---

### Current Sprint Issues (Sprint 2 / P301)

#### KI-007: Ledger Canvas Zero-Dimension Regression
- **ID**: KI-007
- **Title**: Ledger canvas renders with 0×0 dimensions on initial load
- **Status**: Closed
- **Priority**: Critical
- **Component**: Ledger Workspace / Canvas
- **Description**: The `LedgerCanvas` component initializes with zero width/height, causing the three-layer canvas system (PaperLayer, GridLayer, InkLayer) to not render. The canvas container has correct dimensions in DOM but the internal canvas elements are not sized properly.
- **Steps to Reproduce**:
  1. Navigate to `/dashboard/books/[id]/ledger`
  2. Observe blank canvas area (no paper texture, no grid lines)
  3. Inspect canvas elements — width/height are 0
  4. Window resize sometimes triggers correct sizing
- **Impact**: Ledger workspace completely unusable; users cannot write in cells
- **Workaround**: Manual window resize sometimes fixes it; not reliable
- **Resolution**: Fixed in useLedgerCanvas.ts by adding requestAnimationFrame fallback when initial setup fails due to layout timing, and adding dependency on ledgerConfig changes to re-setup canvases when columns/rows change. Added regression test.
- **Assignee**: Drawing Engine Team
- **Due Date**: 2026-08-20
- **Date Resolved**: 2026-08-28
- **Tags**: regression, canvas, ledger, critical

#### KI-008: Handwriting Recognition - MyScript Implementation Complete
- **ID**: KI-008
- **Title**: MyScript iink handwriting recognition implemented (replaces OpenRouter/Google Cloud Vision)
- **Status**: Closed
- **Priority**: High
- **Component**: Handwriting Recognition / API
- **Description**: MyScript iink REST API integration implemented at `/api/ink/recognize`. Uses server-side credentials (MYSCRIPT_APPLICATION_KEY, MYSCRIPT_HMAC_KEY) for secure recognition. Accepts stroke data (not images) for more accurate recognition. Fallback to OpenRouter available.
- **Steps to Reproduce**: N/A — feature implemented
- **Impact**: Core P301 feature complete; users can convert handwriting to text via MyScript
- **Assignee**: Backend Team
- **Due Date**: 2026-08-25
- **Date Resolved**: 2026-08-28
- **Tags**: feature, handwriting, recognition, myscript, api
- **Notes**: OpenRouter and Google Cloud Vision approaches documented as alternatives in .env.local.example but MyScript is primary

#### KI-009: Recognized Text Storage Gap - RESOLVED
- **ID**: KI-009
- **Title**: Recognized text from handwriting recognition persisted to cell content
- **Status**: Closed
- **Priority**: High
- **Component**: Ledger Workspace / Data Layer
- **Description**: MyScript recognition results are now stored in cell data via RecognitionService.onCellStateChange callback. Additionally, typed text entry (keyboard input) is supported via setCellValue in useLedgerWorkspace, providing a reliable text entry path without OCR dependency.
- **Resolution**: Recognition pipeline stores results to cells state; typed entry via EditableCell component (double-click or Enter/F2 on selected cell) bypasses OCR entirely.
- **Assignee**: Backend Team
- **Due Date**: 2026-08-25
- **Date Resolved**: 2026-08-28
- **Tags**: data, persistence, handwriting, ledger, keyboard-entry

#### KI-010: Mobile Ledger Workspace Rendering - RESOLVED
- **ID**: KI-010
- **Title**: Ledger canvas sizing/rendering fixed for mobile viewport
- **Status**: Closed
- **Priority**: High
- **Component**: Ledger Workspace / Mobile
- **Description**: The ledger workspace canvas now correctly adapts to mobile viewport. Fixed scroll container to use h-full (not min-h-full) to properly fill available space after header. Content wrapper height is based on ledger content dimensions but scroll container handles overflow. Mobile toolbar is floating (doesn't consume layout space).
- **Steps to Verify**:
  1. Open ledger workspace on mobile device or Chrome DevTools device toolbar (360px, 390px widths)
  2. Observe canvas fits within viewport without clipping
  3. Horizontal scroll works for wide ledgers
  4. Vertical scroll works for tall ledgers
  5. Header and floating toolbar don't overlap canvas
- **Assignee**: Frontend Team
- **Due Date**: 2026-08-22
- **Date Resolved**: 2026-08-28
- **Tags**: mobile, canvas, responsive, ledger

---

### Carried Over from Sprint 0

#### KI-001: Canvas Performance on Low-End Devices
- **ID**: KI-001
- **Title**: Canvas rendering drops below 30 FPS on low-end Android devices during continuous drawing
- **Status**: Open
- **Priority**: High
- **Component**: Drawing Engine
- **Description**: When drawing complex strokes with many points, the canvas struggles to maintain smooth frame rates on devices with limited GPU capabilities (e.g., older Snapdragon 400 series).
- **Steps to Reproduce**:
  1. Open app on Android device with Snapdragon 450 or equivalent
  2. Select pen tool
  3. Draw continuous scribbles for 10+ seconds
  4. Observe frame drops using performance monitor
- **Impact**: User experience degradation; drawing feels laggy and unresponsive
- **Workaround**: Reduce stroke complexity by increasing point simplification threshold
- **Assignee**: Performance Team
- **Due Date**: 2026-09-01
- **Tags**: performance, mobile, android

#### KI-002: Pressure Sensitivity Inconsistency
- **ID**: KI-002
- **Title**: Pressure sensitivity reports inconsistent value ranges across different stylus devices
- **Status**: Investigating
- **Priority**: Medium
- **Component**: Input Handling
- **Description**: Apple Pencil reports pressure 0-1023, Samsung S Pen reports 0-2048, while some generic styluses report 0-255. This causes inconsistent line width variation.
- **Steps to Reproduce**:
  1. Use different stylus devices to draw with varying pressure
  2. Compare resulting line widths
  3. Observe inconsistency in pressure-to-width mapping
- **Impact**: Inconsistent drawing experience across hardware
- **Workaround**: Normalize pressure input to 0-1 range and apply device-specific curves
- **Assignee**: Input Team
- **Due Date**: 2026-09-15
- **Tags**: input, stylus, pressure

#### KI-003: Touch Palm Rejection False Positives
- **ID**: KI-003
- **Title**: Palm rejection occasionally prevents valid finger input when using stylus
- **Status**: Open
- **Priority**: Medium
- **Component**: Input Handling
- **Description**: The palm rejection algorithm sometimes ignores legitimate finger touches intended for UI interaction (e.g., tapping a button) when a stylus is nearby.
- **Steps to Reproduce**:
  1. Enable stylus mode
  2. Hold stylus near screen without touching
  3. Attempt to tap a button with finger
  4. Observe that tap is not registered
- **Impact**: Reduced usability when switching between stylus and finger input
- **Workaround**: Lift stylus completely away from screen when using fingers
- **Assignee**: UX Team
- **Due Date**: 2026-09-15
- **Tags**: input, touch, palm-rejection

#### KI-004: Local Storage Quota Exceeded Risk
- **ID**: KI-004
- **Title**: IndexedDB storage may exceed quota on devices with limited storage during extended drawing sessions
- **Status**: Open
- **Priority**: Low
- **Component**: Offline Storage
- **Description**: While individual strokes are compact, very long drawing sessions (hours) could potentially exceed IndexedDB storage quotas on some browsers/devices.
- **Steps to Reproduce**:
  1. Disable internet connection
  2. Draw continuously for several hours
  3. Monitor storage usage via developer tools
- **Impact**: Potential data loss if write fails due to quota exceeded
- **Workaround**: Implement automatic cleanup of oldest strokes when approaching quota limits
- **Assignee**: Storage Team
- **Due Date**: 2026-09-30
- **Tags**: storage, offline, quota

#### KI-005: Service Worker Registration Failure on Older Browsers
- **ID**: KI-005
- **Title**: Service workers fail to register on Android WebView versions < 70
- **Status**: Open
- **Priority**: Low
- **Component**: PWA/Offline
- **Description**: Some older Android devices use outdated WebView components that lack full service worker support.
- **Steps to Reproduce**:
  1. Install app on Android device with WebView version 65
  2. Attempt to load app offline
  3. Observe fallback to online-only behavior
- **Impact**: Reduced offline functionality on very old devices
- **Workaround**: Fallback to appcache where available, otherwise document limited offline support
- **Assignee**: Platform Team
- **Due Date**: 2026-09-30
- **Tags**: pwa, service-worker, android

---

### Resolved Issues (for reference)

#### KI-006: Input Latency Too High (RESOLVED)
- **ID**: KI-006
- **Title**: Writing felt slow and laggy, pointer events delayed
- **Status**: Closed
- **Priority**: Critical
- **Component**: Rendering Engine
- **Description**: Every pointer event triggered React state update, causing batching delay and full canvas redraw. This created 100-200ms latency, making writing feel unresponsive.
- **Resolution**: Redesigned rendering architecture:
  - Moved pointer events to refs (no state updates)
  - Implemented requestAnimationFrame loop (independent from React)
  - Added offscreen canvas for completed strokes
  - Only render changed content each frame
- **Date Resolved**: 2026-08-01
- **New Latency**: <16ms (imperceptible)
- **Notes**: See LATENCY_OPTIMIZATION.md for full architecture details
- **Commit**: bae4e42

#### KI-000: Initial Canvas Setup Issue (RESOLVED)
- **ID**: KI-000
- **Title**: Canvas not resizing properly on window orientation change
- **Status**: Closed
- **Resolution**: Added resize observer and proper canvas dimension updating
- **Date Resolved**: 2026-07-31
- **Notes**: Fixed in initial sprint

#### Signup Email Verification Redirect (RESOLVED)
- **ID**: N/A (post-launch fix)
- **Title**: Email verification link redirected to localhost instead of production callback
- **Status**: Closed
- **Priority**: Critical
- **Component**: Authentication
- **Description**: Supabase email template used hardcoded localhost redirect URL, breaking email verification in production.
- **Resolution**: 
  - Updated Supabase email template with production callback URL
  - Added `getAppUrl()` utility for environment-aware URL detection
  - Configured custom email templates with Papyr branding
- **Date Resolved**: 2026-08-09
- **Notes**: Fixed in Sprint 1 post-launch

#### Book Creation Dynamic Color Bug (RESOLVED)
- **ID**: N/A (post-launch fix)
- **Title**: Book cover preview rendered as blank white box due to invalid Tailwind class construction
- **Status**: Closed
- **Priority**: High
- **Component**: Frontend / Book Creation
- **Description**: Used `bg-[{themeColor}]` dynamic class construction which Tailwind cannot compile at build time.
- **Resolution**: 
  - Replaced with fixed 8-theme palette
  - Live preview uses `style={{ backgroundColor: theme.color }}` for dynamic values
  - Serif display face (`font-serif`) for cover titles
- **Date Resolved**: 2026-08-09
- **Notes**: Documented in DECISIONS.md #18

---

### Issue Tracking Guidelines

#### Priority Levels
- **Critical**: Blocks core functionality, data loss, or security vulnerability
- **High**: Significantly impacts usability or core features
- **Medium**: Noticeable inconvenience but workaround available
- **Low**: Minor annoyance or edge case

#### Status Flow
1. **Open**: Issue identified and logged
2. **Investigating**: Root cause analysis in progress
3. **In Progress**: Fix being implemented
4. **Review**: Code review and testing underway
5. **Closed**: Issue resolved and verified

#### Reporting New Issues
When reporting a new issue, please include:
1. Clear, reproducible steps
2. Expected vs actual behavior
3. Environment details (device, OS, browser version)
4. Screenshots or screen recordings if applicable
5. Console logs and network traces if relevant
6. Impact assessment on user experience

#### Review Process
- Triaged weekly during sprint planning
- Assigned based on component ownership and expertise
- Reviewed for duplicates and validity
- Estimated during planning poker sessions

#### Metrics
- **MTTR** (Mean Time To Resolution): Target < 7 days for High priority
- **Escape Rate**: Target < 5% of bugs found in production
- **Customer Impact**: Measure via user feedback and support tickets

#### Document Maintenance
- Updated weekly during triage meetings
- Archived quarterly for resolved issues
- Linked from PROJECT_CONTEXT.md under "Known Issues"
- Available to all team members via internal wiki

--- 
*Last Updated: 2026-08-16*
*Total Open Issues: 8 (KI-001 through KI-005 carried over, KI-007 through KI-010 new)*