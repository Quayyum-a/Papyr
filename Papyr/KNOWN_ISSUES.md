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

### Current Sprint Issues (Sprint 0)

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
- **Due Date**: 2026-08-15
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
- **Due Date**: 2026-08-10
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
- **Due Date**: 2026-08-12
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
- **Due Date**: 2026-08-20
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
- **Due Date**: 2026-08-18
- **Tags**: pwa, service-worker, android

### Resolved Issues (for reference)

#### KI-000: Initial Canvas Setup Issue (RESOLVED)
- **ID**: KI-000
- **Title**: Canvas not resizing properly on window orientation change
- **Status**: Closed
- **Resolution**: Added resize observer and proper canvas dimension updating
- **Date Resolved**: 2026-07-31
- **Notes**: Fixed in commit abc123

---

## Issue Tracking Guidelines

### Priority Levels
- **Critical**: Blocks core functionality, data loss, or security vulnerability
- **High**: Significantly impacts usability or core features
- **Medium**: Noticeable inconvenience but workaround available
- **Low**: Minor annoyance or edge case

### Status Flow
1. **Open**: Issue identified and logged
2. **Investigating**: Root cause analysis in progress
3. **In Progress**: Fix being implemented
4. **Review**: Code review and testing underway
5. **Closed**: Issue resolved and verified

### Reporting New Issues
When reporting a new issue, please include:
1. Clear, reproducible steps
2. Expected vs actual behavior
3. Environment details (device, OS, browser version)
4. Screenshots or screen recordings if applicable
5. Console logs and network traces if relevant
6. Impact assessment on user experience

### Review Process
- Triaged weekly during sprint planning
- Assigned based on component ownership and expertise
- Reviewed for duplicates and validity
- Estimated during planning poker sessions

### Metrics
- **MTTR** (Mean Time To Resolution): Target < 7 days for High priority
- **Escape Rate**: Target < 5% of bugs found in production
- **Customer Impact**: Measure via user feedback and support tickets

### Document Maintenance
- Updated weekly during triage meetings
- Archived quarterly for resolved issues
- Linked from PROJECT_CONTEXT.md under "Known Issues"
- Available to all team members via internal wiki

--- 
*Last Updated: 2026-07-31*
*Total Open Issues: 5*