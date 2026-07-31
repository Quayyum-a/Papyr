# MVP_SCOPE.md

## Minimum Viable Product (MVP) Definition
This document defines the scope of the initial release of Papyr, representing the smallest set of features that delivers value to our target users while validating our core value proposition.

## Vision Statement
Papyr's MVP will enable users to replace their physical paper ledgers with a digital equivalent that feels just as natural to use, while providing the essential benefits of digital storage: searchability, backup, and accessibility across devices.

## Core Value Proposition
"Write exactly like you already do — we just make sure it never gets lost, and you can flip back to any page from any device."

## MVP Goals
1. Validate the core hypothesis: users prefer digital when it feels identical to paper
2. Establish baseline usability and performance benchmarks
3. Gather feedback on essential workflows
4. Create a foundation for iterative improvement based on real user data

## In Scope

### Core Functionality
#### Digital Ledger Basics
- **Unlimited Books**: Create, name, and organize multiple ledger books
- **Page Management**: Add, remove, and reorder pages within books
- **Simple Navigation**: Flip between pages with touch/mouse gestures
- **Persistent Storage**: All data saved automatically and durable

#### Drawing & Ink Experience
- **Natural Handwriting**: Smooth, responsive stroke rendering
- **Pressure Sensitivity**: Variable line width based on stylus pressure (when available)
- **Palm Rejection**: Ignore touch input when using active stylus
- **Multiple Tools**: Pen, pencil, highlighter with distinct visual characteristics
- **Color Selection**: Basic color palette (black, blue, red, green)
- **Stroke Smoothing**: Apply perfect-freehand algorithm for natural-looking lines
- **Input Methods**: Support for mouse, touch, and pen/stylus input

#### Essential Editing
- **Undo/Redo**: Basic undo and redo functionality (Ctrl+Z / Cmd+Z, Ctrl+Y / Cmd+Shift+Z)
- **Clear Canvas**: Option to clear current drawing area
- **Object Selection**: Future enhancement - not in MVP

#### Data Persistence
- **Auto-Save**: Changes saved automatically without user action
- **Local First**: Works fully offline with data stored locally
- **Sync When Online**: Changes synchronize when connection is restored
- **Conflict Resolution**: Last-write-wins for simultaneous edits

### User Interface
#### Main Workspace
- **Full-Screen Canvas**: Drawing area occupies maximum available space
- **Minimal Chrome**: UI elements hidden by default, appear on gesture
- **Contextual Toolbar**: Relevant tools appear based on context
- **Page Indicator**: Visual indicator of current page and total pages
- **Navigation Gestures**: Swipe left/right to change pages (touch), click arrows (mouse)

#### Settings & Configuration
- **Basic Preferences**: 
  - Default pen color and width
  - Palm sensitivity adjustment
  - Animation intensity
- **Account Management**:
  - Email/password sign up and login
  - Password reset
  - Profile picture and name
- **Appearance**:
  - Light/Dark mode toggle (follows system preference by default)
  - Paper texture toggle (on/off)

#### Onboarding & Help
- **First-Time Experience**: Guided tour highlighting key features
- **Contextual Help**: Tooltips for new users on first use
- **Empty State**: Guidance when no books exist
- **Error Recovery**: Clear messages when sync fails

### Technical Foundation
#### Architecture
- **Offline-First**: IndexedDB for local storage, Sync when online
- **Modular Frontend**: React with clean separation of concerns
- **Typed API**: TypeScript interfaces between client and server
- **Responsive Design**: Works on mobile phones, tablets, and desktop
- **Progressive Web App**: Installable via browser with offline capabilities

#### Backend Services
- **Authentication**: Email/password registration and login via Supabase Auth
- **Data Storage**: PostgreSQL for structured data (books, pages, etc.)
- **Blob Storage**: Efficient storage for stroke data via Supabase Storage or database JSONB
- **Real-Time Capabilities**: Prepared for future collaboration (not active in MVP)
- **Security**: Row-Level Security (RLS) enforcing data isolation

#### Development & Operations
- **Source Control**: Git with trunk-based development
- **CI/CD**: Automated testing, building, and deployment to preview environments
- **Monitoring**: Basic error tracking and performance monitoring
- **Feature Flags**: Ability to disable features for testing or gradual rollout
- **Logging**: Structured logging for debugging and auditing

### Non-Functional Requirements (MVP Level)
#### Performance
- **Startup Time**: < 2 seconds on mid-tier mobile device
- **Drawing Latency**: < 50ms from input to visual feedback (target < 25ms)
- **Frame Rate**: Maintain >30fps during continuous drawing
- **Load Time**: Subsequent loads < 1 second (cached resources)

#### Usability
- **Learnability**: First-time user can create book and draw within 30 seconds
- **Efficiency**: Experienced user can perform common tasks in < 5 seconds
- **Error Rate**: < 5% error rate in usability testing with target users
- **Satisfaction**: Target SUS score > 70 after first use

#### Reliability
- **Data Durability**: Zero data loss under normal conditions
- **Graceful Degradation**: Core functionality works even when services degraded
- **Recovery**: Automatic recovery from common error states
- **Backup**: Daily automated backups of production data

#### Security
- **Authentication**: Industry-standard secure authentication via Supabase
- **Authorization**: Users can only access their own data
- **Transport Security**: TLS 1.3 for all communications
- **Data Privacy**: No unnecessary data collection
- **Vulnerability Management**: Regular dependency scanning

## Out of Scope for MVP
These features are explicitly deferred to post-MVP releases to maintain focus on validating the core hypothesis.

### Advanced Document Features
- **Rich Text Editing**: Formatted text insertion and editing
- **Image Insertion**: Importing and manipulating images
- **Shape Tools**: Rectangles, circles, lines, polygons
- **Stencils & Templates**: Reusable forms and layouts
- **Layers**: Separation of drawing elements
- **Grid & Ruler**: Precision drawing aids
- **Templates**: Pre-formatted pages for common uses (invoices, calendars)

### Collaboration & Sharing
- **Real-Time Collaboration**: Simultaneous editing by multiple users
- **Commenting**: Discussion threads on documents
- **Version History**: View and restore previous versions
- **Sharing Links**: Share view-only or edit links with others
- **Export/Import**: PDF, PNG, SVG, and JSON formats
- **Printing**: Direct printing from browser

### Advanced Organization
- **Search**: Full-text search across notebooks
- **Tagging**: Categorize books and pages with tags
- **Favorites**: Quick access to frequently used books
- **Trash/Archive**: Recover deleted items
- **Bulk Operations**: Move/delete multiple items at once
- **Templates**: User-created and shared page templates

### Customization & Personalization
- **Custom Toolbars**: User-configurable tool arrangements
- **Brush Studio**: Create and save custom brush types
- **Template Marketplace**: Community-shared templates
- **Themes**: Custom color schemes beyond light/dark
- **Font Selection**: For text elements (when implemented)
- **Paper Styles**: Different textures, line patterns, colors

### Administrative Features
- **User Management**: Admin view of system usage (future enterprise)
- **Usage Analytics**: Aggregated, anonymized usage metrics
- **Data Export**: GDPR-compliant data export functionality
- **Billing Integration**: For future premium features
- **SSO**: Enterprise single sign-on (SAML, OAuth2)
- **Audit Logging**: For compliance and debugging

### Technical Enhancements
- **Multi-Device Sync**: Real-time sync across all user devices
- **Conflict Resolution UI**: Visual conflict resolution for complex cases
- **Selective Sync**: Choose which books to sync to which devices
- **Bandwidth Awareness**: Adaptive quality based on connection
- **Background Sync**: Sync when app is not in foreground
- **Push Notifications**: For collaboration alerts (future)
- **Offline-First Analytics**: Local analytics that sync when online

### Platform-Specific Features
- **Native App Distribution**: iOS/Android stores (PWA covers initial needs)
- **Deep Linking**: Open specific documents from URLs or other apps
- **File System Access**: Save/export to device file system (future)
- **Print Integration**: Native printing dialogs
- **Share Sheets**: Share images or PDFs to other apps
- **Haptics**: Device**: Handoff between iOS/macOS devices
- **Continuity Camera**: Use iPhone as webcam for Mac (future)

### Advanced Security & Compliance
- **End-to-End Encryption**: Optional client-side encryption
- **Data Residency**: Choose geographic location for data storage
- **Access Logs**: Detailed audit trail for compliance
- **Data Retention Policies**: Automatic deletion after period
- **Legal Hold**: Preserve data for legal proceedings
- **FIPS 140-2**: For government use (future)

## Success Criteria for MVP
These metrics will determine if the MVP is ready to launch and if we should proceed with further investment.

### Adoption Metrics
- **Activation Rate**: >40% of signups create a book and draw within first session
- **Retention Rate**: >25% of week-1 users active at week 2
- **Daily Active Users (DAU)**: >15% of monthly active users
- **Session Frequency**: Average 3.2 sessions per week per active user

### Engagement Metrics
- **Average Session Duration**: >4 minutes
- **Pages Created per User**: >2.5 in first week
- **Strokes per Minute**: >40 during active drawing sessions
- **Feature Usage**: 
  - Undo/Redo used by >60% of users
  - Multiple tools used by >40% of users
  - Multiple books created by >25% of users

### Technical Performance
- **Crash Rate**: < 0.5% of sessions
- **Error Rate**: < 2% of API calls return errors
- **Page Load Time**: P95 < 2 seconds on 3G
- **Drawing Latency**: P95 < 40ms input to visual
- **Frame Drops**: < 5% of frames exceed 16.67ms (60fps target)
- **Battery Drain**: < 5% per hour of active drawing

### Quality Metrics
- **Escaped Defects**: < 2 critical bugs per month post-launch
- **Customer Satisfaction (CSAT)**: > 4.0/5.0 from in-app survey
- **Net Promoter Score (NPS)**: > 20
- **System Usability Scale (SUS)**: > 68 (above average)

### Learning & Validation
- **Qualitative Feedback**: 80% of interviewees report "feels like paper"
- **Paper Substitution**: >30% of active users report reduced paper notebook usage
- **Use Case Validation**: Top 3 use cases match predictions (e.g., daily logs, sketches, inventory)
- **Willingness to Pay**: >25% of users express interest in premium features (for future monetization)

## Release Criteria
The MVP will be considered ready for release when:
1. All core functionality is implemented and tested
2. Performance benchmarks are met on target devices
3. Critical and high-severity bugs are resolved
4. Basic accessibility compliance (WCAG AA) is achieved
5. Documentation is complete for end users
6. Security review has been passed with no high/critical findings
7. Monitoring and alerting are configured for production
8. Rollback procedures have been tested
9. Release notes and communication plan prepared
10. Product owner has signed off on release

## Post-MVP Planning
Immediate priorities after MVP launch:
1. **Stability & Performance**: Address any issues uncovered in real-world usage
2. **User Feedback Analysis**: Qualitative and quantitative analysis of user input
3. **Essential Enhancements**: High-impact, low-effort improvements based on data
4. **Core Workflow Completion**: Finish any partially implemented flows
5. **Platform Expansion**: Optimize for additional device categories
6. **Prepare for Growth**: Scale infrastructure and team as needed

## Assumptions & Dependencies
### Assumptions
- Target users have access to smartphones or tablets with modern browsers
- Core user base values the paper-like experience over advanced features
- Offline-first capability is a key differentiator and requirement
- Users will trust digital storage with their business data after seeing reliability
- The combination of perfect-freehand and responsive canvas creates adequate paper-like feel
- Target users are comfortable with basic smartphone/tablet interactions

### Dependencies
- **Supabase**: Stable service with acceptable performance and pricing
- **Modern Browser APIs**: IndexedDB, Pointer Events, Service Workers, Web Crypto
- **Device Sensors**: Access to touch and pressure events where available
- **Network Connectivity**: Intermittent connectivity assumed; pure offline mode works
- **Third-Party Libraries**: Continued maintenance of perfect-freehand, Tailwind, etc.
- **Open Source Licenses**: Compliance with MIT, Apache, and other permissive licenses

## Rollback Plan
If post-launch metrics indicate failure to meet success criteria:
1. **Immediate Response**: Activate feature flags to disable problematic components
2. **Hotfix**: Deploy critical fixes within 24 hours
3. **Rollback**: Revert to previous stable version if necessary (maintained for 7 days)
4. **Investigation**: Conduct root cause analysis of failed metrics
5. **Plan Revision**: Adjust scope and priorities based on findings
6. **Stakeholder Communication**: Transparent communication with users and team

## Success Metrics Dashboard
Will be implemented in Mixpanel/Amplitude or similar tracking to monitor:
- Funnel metrics: Visit → Signup → First Book → First Drawing → Return
- Engagement: DAU/WAU/MAU ratios, session length, frequency
- Performance: Custom timers for key interactions
- Quality: Error rates, crash reports, user-submitted bug reports
- Business: Retention curves, cohort analysis, LTV/CAC projections

## Appendices

### Appendix A: User Personas (MVP Focus)
1. **Maria, 34, Pharmacy Owner**: Tracks daily sales, inventory, and employee hours in a paper notebook. Needs something that won't get lost or damaged by spills.
2. **David, 22, Apprentice Electrician**: Logs job details, parts used, and client notes. Works on construction sites with dust and occasional rain.
3. **Sarah, 45, Boutique Manager**: Records daily takings, special orders, and customer preferences. Wants to look up past entries quickly.
4. **James, 58, Mechanic**: Tracks repair jobs, parts inventory, and customer vehicles. Prefers simple tools that don't require training.

### Appendix B: User Journey Maps
*Key scenarios for MVP validation*

### Appendix C: Technical Architecture Diagrams
*Component interaction diagrams, data flow charts*

### Appendix D: Release Checklist
*Detailed checklist for release readiness*

--- 
*Document Version: 1.0.0*
*Last Updated: 2026-07-31*
*Approved By: Product Lead*
*Next Review: 2026-08-15 (post-launch evaluation)*