# DEPLOYMENT.md

## Deployment Overview
This document outlines the deployment strategies, processes, and procedures for the Papyr application across all environments. It covers everything from local development to production releases, including rollback procedures, versioning, and release management.

## Deployment Philosophy
- **Automate Everything**: Manual steps are error-prone and slow
- **Deploy Frequently**: Small, frequent changes reduce risk
- **Monitor Constantly**: Observe system behavior before, during, and after deployment
- **Rollback Fast**: Ability to revert quickly is essential for safety
- **Test in Production-like Environments**: Catch issues before they affect users
- **Progressive Delivery**: Reduce risk by exposing changes gradually

## Deployment Pipeline Overview
```
Local Development 
   ↓ (git commit/push)
Pull Request → CI/CD Pipeline 
   ↓ (if checks pass)
Staging Environment (Automatic Deploy on main) 
   ↓ (manual validation)
Production Deployment (Manual Trigger or Scheduled) 
   ↓ (monitoring and verification)
```
With parallel processes for:
- Security Scanning
- Performance Budget Validation
- Dependency Updates
- Documentation Generation

## Versioning Strategy

### Semantic Versioning
Papyr follows Semantic Versioning 2.0.0:
```
MAJOR.MINOR.PATCH
```
- **MAJOR**: Incompatible API changes or major product shifts
- **MINOR**: Backward-compatible functionality additions
- **PATCH**: Backward-compatible bug fixes

### Version Format
- **Releases**: `v1.0.0`, `v1.2.3`, `v2.0.0`
- **Pre-releases**: `v1.0.0-alpha.1`, `v1.0.0-beta.2`, `v1.0.0-rc.3`
- **Build Metadata**: `v1.0.0+20260731.1` (commit hash or timestamp)

### Version Sources
- **Package.json**: `"version": "1.0.0"` (source of truth for npm)
- **Git Tags**: `v1.0.0` points to release commit
- **Docker Images**: `papyr:1.0.0`, `papyr:latest` (for any containerized services)
- **Application State**: Available via `/api/config` endpoint and UI footer
- **Build Artifacts**: Included in filenames and metadata

### Versioning Practices
- **Patch Releases**: For bug fixes and small improvements (weekly cadence)
- **Minor Releases**: For new features and enhancements (every 8-10 weeks)
- **Major Releases**: For breaking changes or major product shifts (less frequent)
- **Pre-release Versions**: For internal testing and staged rollouts
- **Version Bumping**: Automated via `npm version` or manual for major/minor

## Environment-Specific Deployment

### Development Environment Deployment
**Purpose**: Local testing and debugging

**Process**:
1. Developer makes changes locally
2. Starts development server: `npm run dev`
3. Next.js dev server provides hot module replacement
4. Changes are visible immediately upon save
5. Supabase connection (local or remote) provides backend
6. Local IndexedDB stores offline data

**Tools**:
- Next.js Dev Server
- Webpack/HMR for fast updates
- React Refresh for component state preservation
- Local Supabase (via Docker) or remote dev project
- LocalStorage/IndexedDB for frontend state

**Limitations**:
- Not representative of production performance
- Missing some production optimizations
- May not catch environment-specific issues

### CI/CD Testing Environment Deployment
**Purpose**: Automated validation of code changes

**Trigger**: Pull request or push to any branch

**Process**:
1. GitHub Actions workflow triggered
2. Checkout code at specific commit
3. Setup Node.js (version from .nvmrc or engines field)
4. Cache node_modules based on package-lock.json
5. Install dependencies: `npm ci`
6. Run linting: `npm run lint`
7. Run type checking: `npm run type-check`
8. Run unit tests with coverage: `npm test:coverage`
9. Build production bundle: `npm run build`
10. Run end-to-end tests against preview deployment: `npm test:ehr`
11. Upload test reports, coverage, and build artifacts
12. Set GitHub check status (success/failure)
13. Notify on failure via Slack/email

**Artifacts Stored**:
- Test results (JUnit XML)
- Coverage reports (HTML and LCOV)
- Build output (.next directory)
- Lighthouse reports
- Security scan results
- Playwright traces and videos (on failure)

**Access**:
- Internal only (GitHub Actions runners and those with repo access)
- Workflow logs visible to anyone with repo read access
- Artifacts downloadable for those with repo write access

### Staging Environment Deployment
**Purpose**: Pre-production validation with realistic data

**Trigger**: 
- Automatic: Push to main branch (after CI passes)
- Manual: On-demand via workflow_dispatch or Vercel redeploy

**Process**:
1. Code merged to main branch
2. CI pipeline validates changes
3. Vercel automatically creates preview deployment for PRs
4. On push to main, Vercel updates production deployment
5. Environment variables injected at build time
6. Next.js application built for production
7. Deployed to Vercel's edge network
8. Health checks performed by Vercel
9. Traffic routed to new deployment
10. Previous version retained for instant rollback

**Configuration Sources**:
- Vercel project settings
- Environment variables (set in Vercel UI)
- Next.js configuration (next.config.js)
- Supabase project settings (separate from prod)
- Feature flags (managed via LaunchDarkly, ConfigCat, or custom solution)

**Validation Steps**:
1. Automatic health checks by Vercel (HTTP 200 on /api/health)
2. Manual smoke test by engineering lead
3. Performance budget check (Lighthouse CI)
4. Security scan verification
5. Feature flag verification
6. Database migration verification (if applicable)
7. Smoke test by product/stakeholder

**Rollback Mechanism**:
- Vercel retains previous deployments
- Instant rollback via Vercel dashboard or CLI
- DNS change propagation < 1 second
- Session affinity maintained during transition
- WebSocket connections may need to reconnect

**Access**:
- URL: Staging-specific subdomain (e.g., `papyr-staging.vercel.app`)
- Authentication: Open to team, optional whitelist for stakeholders
- Administrative access: Limited via Vercel team roles and Supabase roles

### Production Environment Deployment
**Purpose**: Live service for end users

**Trigger**:
- **Scheduled**: Regular release cycle (every 8-10 weeks for minor/major)
- **Patch**: As needed for critical fixes (goal: <4 hours from fix to deploy)
- **Emergency**: Immediate for security or data integrity issues
- **Manual**: On-demand via workflow_dispatch (rare)

**Process**:
1. **Pre-Release Preparation**:
   - Code merged to main branch after PR approval
   - Version bumped via `npm version` or manual update
   - Changelog updated with changes since last release
   - Release notes drafted
   - Rollback procedures verified
   - Monitoring alerts configured and tested
   - Stakeholder notification sent
2. **Build Phase**:
   - Clean checkout of release commit
   - Dependency installation with `--production` flag
   - Prebuild scripts execution
   - Next.js production build (`next build`)
   - Export optimization (`next export` if applicable, otherwise serverless)
   - Artifact packaging (if needed for external deployment)
3. **Deployment Phase**:
   - Trigger Vercel production deployment (automatic on main or manual)
   - Vercel builds if not already built (should match CI build)
   - Deployment to Vercel's edge network
   - Health checks performed by Vercel (/api/health endpoint)
   - Traffic gradually shifted (canary) or immediately switched
   - Previous version retained for instant rollback
4. **Post-Deployment Verification**:
   - Immediate health check verification
   - Smoke test of critical paths (login, draw, save)
   - Monitoring dashboard verification (error rates, latency)
   - Web Vitals verification (LCP, FID, CLS)
   - Business metric verification (active users, session duration)
   - Stakeholder verification and sign-off
5. **Post-Deployment Monitoring**:
   - Enhanced monitoring for first hour
   - Standard monitoring resume after 4 hours
   - Full normal monitoring after 24 hours
   - Daily review for first week (for major releases)

**Access Control**:
- **Deployment Initiation**: 
  - Limited to DevOps lead, tech lead, and authorized CI/CD systems
  - Requires MFA for GitHub and Vercel access
  - Approval workflow for manual deployments
- **Post-Deployment Access**:
  - Production URLs: `https://papyr.app` and associated domains
  - Authentication: Standard user auth flows
  - Administrative: Role-based access control (RBAC) in application
  - Infrastructure: Limited to DevOps and authorized personnel
  - Databases: Read-only access for most, read/write for DBAs only

**Rollback Mechanism**:
- **Instant Rollback**: Vercel retains previous deployments
  - Rollback via Vercel CLI, dashboard, or API
  - DNS change propagates globally in < 1 second
  - Sessions may need to reestablish WebSocket connections
- **Delayed Rollback**: 
  - For database migration issues, may require forward fix
  - Documented rollback procedures for data changes
  - Backup restoration if needed (rare)
- **Emergency Procedures**:
  - Incident declared by on-call engineer
  - War room assembled if needed
  - Communication via status page and direct user notifications
  - Post-incident review and improvement planning

## Deployment Strategies

### Blue/Green Deployment
**Description**: Maintain two identical production environments (Blue and Green). Only one serves live traffic at a time.

**Applicability**: 
- Used by Vercel automatically for preview deployments
- Not currently used for main production due to Vercel's native handling
- Could be implemented for multi-region deployments

**Pros**:
- Instant rollback capability
- Reduced downtime
- Easy testing of production environment

**Cons**:
- Double resource cost
- Complex data synchronization if stateful
- More complex to manage

### Canary Release
**Description**: Roll out changes to a small percentage of users before full deployment.

**Applicability**: 
- Used for feature flags and gradual rollouts
- Planned for future major releases with significant changes
- Currently simulated via feature flags

**Pros**:
- Risk mitigation through limited exposure
- Real-world validation with actual users
- Easy to abort if metrics deteriorate
- Can target specific user segments

**Cons**:
- Requires sophisticated metrics and monitoring
- More complex to manage
- Potential for inconsistent user experience
- Need to maintain multiple versions temporarily

### Rolling Update
**Description**: Gradually replace instances of an application with new versions.

**Applicability**: 
- Not applicable to Vercel's serverless model
- Would be used if we moved to containerized orchestration (Kubernetes)
- Not currently in use

**Pros**:
- No need for duplicate environments
- Continuous service availability
- Granular control over rollout pace

**Cons**:
- Mixed versions running simultaneously
- Complexity in managing schema changes
- Potential for conflicts between versions

### Recreate Strategy
**Description**: Stop all instances, deploy new version, start all instances.

**Applicability**: 
- Used during development and testing
- Not used for production due to downtime
- Simple but disruptive

**Pros**:
- Simple to understand and implement
- No version conflicts
- Guaranteed clean state

**Cons**:
- Downtime during deployment
- Not suitable for high availability requirements

### Current Papyr Strategy
Given our use of Vercel (serverless Next.js) and Supabase (managed Postgres):
- **Frontend**: Utilizes Vercel's built-in deployment system
  - Effectively implements Blue/Green for preview deployments
  - For production: Immediate switch with instant rollback capability
  - Feature flags enable canary-style releases for new features
- **Backend**: 
  - Supabase managed service handles scaling
  - Schema changes via migrations (backward compatible where possible)
  - Data changes are immediate; forward-only for breaking changes
  - Read replicas could be used for scaling reads (future)

### Feature Flags & Gradual Rollouts
**Implementation**:
- Using a lightweight feature flag service (LaunchDarkly, ConfigCat, or custom)
- Flags evaluated at runtime with reasonable caching
- Flags can target:
  - All users
  - Percentage of users (e.g., 5%, 25%, 50%)
  - Specific user segments (email domain, behavior, tenure)
  - Internal/test users only
- Defined in code with clear naming conventions
- Removed after full rollout or retirement

**Best Practices**:
- Flag names should be descriptive and stable
- Default to false for new features (dark launch)
- Remove flags within 2-4 release cycles after full adoption
- Document flag purpose, owner, and removal date
- Test both flag states (on/off) in automation
- Monitor metrics by flag variation

## Release Management

### Release Types
1. **Patch Release** (`vx.y.z` → `vx.y.z+1`):
   - Bug fixes only
   - No new features
   - Minimal risk
   - Frequency: Weekly or as needed
   - Process: CI → Staging verification → Production deploy
   - Notification: Minimal (status update if impactful)

2. **Minor Release** (`vx.y.z` → `vx.y+1.0`):
   - New features and enhancements
   - Backward compatible
   - Moderate risk
   - Frequency: Every 8-10 weeks
   - Process: Feature branch → CI → Staging validation → Prod deploy
   - Notification: Release notes, in-app announcement, email digest

3. **Major Release** (`vx.y.z` → `vx+1.0.0`):
   - Breaking changes or significant product shifts
   - May require migration steps
   - Higher risk
   - Frequency: Every 6-12 months or as needed
   - Process: Extended beta → Staging validation → Prod deploy
   - Notification: Comprehensive campaign, blog post, press release

4. **Hotfix/Emergency Release**:
   - Critical bug or security issue
   - Bypasses normal cycle
   - Process: Branch from main → Fix → CI → Expedited staging → Prod
   - Notification: Immediate if user impact, otherwise status update

### Release Calendar
- **Development Cycle**: 2-week sprints
- **Release Cadence**: Align with end of sprint (every other sprint for minor/major)
- **Freeze Period**: 2 days before release (no non-critical merges)
- **Release Window**: Tuesday 10:00-14:00 UTC (lowest global usage)
- **Blackout Periods**: Major holidays, known high-traffic events
- **Flexibility**: Emergency releases can break schedule as needed

### Release Roles & Responsibilities
**Release Manager** (usually DevOps Lead):
- Owns release process and timeline
- Coordinates between teams
- Ensures all checks pass
- Triggers deployment
- Monitors deployment and immediate aftermath
- Declares release success or initiates rollback

**Product Lead**:
- Validates release contents match commitments
- Approves feature completeness
- Reviews release notes for accuracy
- Confirms stakeholder readiness
- Signs off on release readiness

**Tech Lead**:
- Reviews technical quality and debt
- Confirms architectural integrity
- Validates performance benchmarks
- Ensures no breaking changes unless intended
- Signs off on technical readiness

**QA Lead**:
- Confirms test coverage and quality
- Reviews test results from staging
- Validates acceptance criteria
- Ensures regression testing passed
- Signs off on quality readiness

**Security Lead**:
- Reviews security implications
- Confirms no new vulnerabilities introduced
- Validates security control effectiveness
- Signs off on security readiness

**Support Lead**:
- Prepares support team for potential issues
- Reviews known issues and workarounds
- Confirms runbooks are up to date
- Stands by during and after release
- Signs off on support readiness

### Release Artifacts
Each release produces:
- **Git Tag**: `v1.0.0` pointing to release commit
- **Release Notes**: Detailed markdown file in CHANGELOG.md and GitHub release
- **Build Artifacts**: `.next` directory, optimized bundles
- **Container Images**: If applicable (not currently used)
- **Documentation**: Updated user guides, API references, API spec
- **Testing Reports**: Summary of test execution and results
- **Performance Baselines**: Lighthouse scores and custom metrics
- **Security Reports**: Scan results and vulnerability assessments
- **Rollback Procedure**: Specific steps for this release
- **Announcement Materials**: Blog drafts, social media posts, email templates

### Release Communication Plan
**Internal**:
- Pre-Release: 
  - Release readiness meeting 24 hours before
  - Briefing on what's changing and risk factors
  - Confirmation of rollback procedures
- During Release:
  - Real-time updates in #releases Slack channel
  - Alert on-call engineer and support lead
- Post-Release:
  - Deployment summary in #releases
  - Metrics snapshot at 1 hour, 4 hours, 24 hours
  - Lessons learned shared in retrospective
  - Feedback collection from stakeholders

**External**:
- Users:
  - In-app notification for major changes
  - Email newsletter for feature releases
  - Blog post for significant improvements
  - Status page for incidents and maintenance
  - Social media for public announcements
- Stakeholders:
  - Executive summary for leadership
  - Detailed report for investors/board
  - Custom communication for enterprise customers
- Public/Press:
  - Press release for major milestones
  - Blog post for technical innovations
  - Update to public roadmap (high-level themes only)

## Rollback Procedures

### When to Rollback
Rollback should be considered when:
- Critical error rate exceeds threshold (e.g., >5% of requests)
- Core functionality is broken (login, drawing, saving)
- Data corruption or loss is detected or suspected
- Security vulnerability is actively being exploited
- Performance degradation severely impacts usability (e.g., >50% latency increase)
- Feature flag causes unexpected behavior that can't be mitigated via flag
- Compliance violation is detected
- User impact is severe and widespread

### Rollback Decision Process
1. **Detection**: Alert from monitoring, user report, or internal test
2. **Assessment**: 
   - Quick triage to determine scope and severity
   - Determine if issue is new with this deployment
   - Estimate impact and spread
   - Consider mitigation via feature flag or hotfix
3. **Decision**:
   - If mitigatable via feature flag: Disable flag and monitor
   - If hotfix possible (<1 hour fix): Prepare hotfix instead
   - If requires rollback: Proceed with rollback procedure
4. **Authorization**:
   - Tech Lead or DevOps Lead can initiate rollback
   - For major incidents, consult Incident Commander
   - Inform Product Lead and stakeholder as appropriate
5. **Execution**:
   - Follow documented rollback procedure
   - Monitor closely during and after rollback
   - Validate that issue is resolved
6. **Communication**:
   - Internal: Notify team of rollback and reason
   - External: Status page update if user-impacting
   - Provide clear explanation and next steps
7. **Post-Rollback**:
   - Root cause analysis initiated
   - Issue ticket created for fix
   - Fix scheduled (hotpatch or next release)
   - Preventive measures considered

### Rollback Execution
**Frontend Rollback (Vercel)**:
1. Access Vercel dashboard or CLI
2. Select "Deployments" tab for the project
3. Find previous successful deployment
4. Click "Rollback to this deployment" or use `vercel rollback`
5. Confirm rollback action
6. Monitor deployment progress and health checks
7. Verify service restoration via health checks and synthetic tests

**Backend Rollback (Supabase)**:
- **Schema Changes**: 
  - Ideally avoided via backward compatible migrations
  - If necessary, use migration down scripts
  - Requires coordination and downtime window
- **Data Changes**:
  - Generally forward-only; fix with corrective data migration
  - Rarely: Point-in-time recovery (PITR) if caught immediately
  - Requires specific point in time and validation
- **Configuration**: 
  - Roll back environment variables to previous values
  - Restore any altered project settings
  - Verify authentication and storage settings

**Rollback Verification**:
1. Health check passes (`/api/health` returns 200 OK)
2. Smoke test of critical user flows
3. Error rate returns to baseline
4. Performance metrics normalize
5. Feature flags in expected states
6. Stakeholder confirmation of resolution
7. No new issues introduced by rollback

### Rollback Prevention
To minimize need for rollbacks:
1. **Comprehensive Testing**: Catch issues before they reach production
2. **Feature Flags**: Allow disabling problematic features without redeploy
3. **Canary Analysis**: Detect issues with small user exposure before full rollout
4. **Gradual Schema Changes**: Use backward compatible migrations
5. **Blue/Green Testing**: Validate production environment before switching
6. **Immutable Infrastructure**: Reduce configuration drift
7. **Automated Rollback Testing**: Practice rollback procedures regularly
8. **Observability**: Detect issues early through comprehensive monitoring
9. **Change Freeze**: Avoid non-essential changes during high-risk periods
10. **Post-Deployment Monitoring**: Watch closely after deployment

## Deployment Tools & Scripts

### Version Control
- **Git**: Primary source control
- **GitHub**: Hosting, PRs, Actions, Projects
- **Git LFS**: For large binary assets (if any)

### Build Tools
- **Node.js**: JavaScript runtime
- **npm**: Package manager (scripts in package.json)
- **Next.js**: React framework with built-in optimization
- **Vercel**: Platform for frontend deployment and preview
- **Supabase CLI**: For managing Supabase projects locally
- **dotenv-cli**: For managing environment variables

### Testing Tools
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing framework
- **React Testing Library**: Testing utility for React components
- **MSW**: Mock Service Worker for API interception
- **Jest**: Used indirectly via Vitest compatibility
- **chromatic**: Visual regression testing (if used)

### Deployment & Infrastructure Tools
- **Vercel CLI**: `vercel` for triggering deployments and managing projects
- **Supabase CLI**: `supabase` for managing Supabase projects
- **docker-compose**: For local development services
- **nginx**: Local proxy or API gateway (if needed)
- **certbot**: For SSL certificates (if self-hosting)
- **cloudflared**: For Argo Tunnel (if using Cloudflare Access)

### Monitoring & Observability
- **Sentry**: Error tracking and performance monitoring
- **Google Analytics**: Web analytics (planned)
- **Web Vitals**: Measuring LCP, FID, CLS, etc.
- **Lighthouse**: Automated performance and quality audits
- **Custom Metrics**: Application-specific metrics via Prometheus client
- **Health Checks**: `/api/health` endpoint
- **Synthetic Transactions**: Periodic checks of critical paths
- **Log Aggregation**: External service (Elasticsearch, Datadog, Splunk)
- **Distributed Tracing**: OpenTelemetry or similar (future)

### Notification & Communication
- **Slack**: Team communication and alerts
- **Email**: Formal notifications and newsletters
- **SMS**: Critical alerts for on-call personnel (via Twilio or similar)
- **Status Page**: Public incident communication (via Statuspage.io or similar)
- **Wiki**: Internal documentation (Notion, Confluence, or similar)
- **Knowledge Base**: External support documentation (Help Scout, Zendesk, etc.)

### Security Tools
- **Snyk**: Dependency vulnerability scanning
- **Dependabot**: Automated dependency updates with PRs
- **CodeQL**: GitHub's security analysis
- **OWASP ZAP**: Manual and automated security testing
- **Nessus**: Vulnerability scanning (periodic)
- **Burp Suite**: Professional security testing (as needed)

### Data Management
- **Supabase Migrations**: Schema change management
- **pg_dump/pg_restore**: Backup and restore utilities (if needed)
- **csvkit**: CSV manipulation for data migration
- **jq**: JSON processing for configuration and data
- **Redis-cli**: For Redis interaction (if used for caching)
- **MongoDB Tools**: If using MongoDB for specific use cases

## Environment Promotion Checklist

### Development → Testing (CI)
- [ ] Code compiles without TypeScript errors
- [ ] ESLint passes with no errors
- [ ] Unit tests pass with required coverage
- [ ] Linting passes
- - [ ] No new high/critical dependencies vulnerabilities
- [ ] Build succeeds without warnings
- [ ] Commit message follows conventional commits
- [ ] PR description adequately explains changes
- [ ] Associated issues referenced

### Testing → Staging
- [ ] All CI checks pass
- [ ] Preview deployment builds successfully
- [ ] Health check passes on preview
- [ ] Basic smoke test passes on preview
- [ ] No regression in performance budget (Lighthouse CI)
- [ ] No new security vulnerabilities introduced
- [ ] Database migrations (if any) are backward compatible
- [ ] Feature flags are set appropriately for staging
- [ ] Environment variables configured correctly
- [ ] Staging data is refreshed and ready
- [ ] Stakeholder notified of upcoming staging deploy

### Staging → Production
- [ ] Staging smoke test passes
- [ ] Performance benchmarks met (no >5% regression from baseline)
- [ ] Security scan shows no new critical/high vulnerabilities
- [ ] All acceptance criteria validated
- [ ] Database migrations verified and tested
- [ ] Feature flags configured for production rollout
- [ ] Environment variables set correctly for production
- [ ] Rollback procedure documented and tested
- [ ] Monitoring alerts configured and tested
- [ ] Support team briefed and on standby
- [ ] Stakeholder sign-off obtained
- [ ] Release notes prepared and reviewed
- [ ] Communication plan ready

## Emergency Procedures

### Incident Response
1. **Detection**: Alert from monitoring, user report, or internal system
2. **Triage**: 
   - Assign Incident Commander (usually Tech Lead or DevOps Lead)
   - Determine severity (SEV-1: site down, SEV-2: major degradation, SEV-3: minor issue)
   - Assemble war room if needed (SEV-1/SEV-2)
3. **Mitigation**:
   - Implement immediate workaround if possible
   - Consider feature flag disable
   - Prepare for rollback or hotfix
4. **Communication**:
   - Internal: Notify team via @here in #incidents
   - External: Update status page if user-impacting
   - Customers: Direct communication if affected per severity
5. **Resolution**:
   - Execute fix (hotfix, rollback, or patch)
   - Verify resolution via monitoring and synthetic tests
   - Confirm with stakeholders
6. **Recovery**:
   - Return to normal operations
   - Resume regular monitoring
   - Prepare post-mortem
7. **Post-Mortem**:
   - Schedule blameless post-mortem meeting
   - Document timeline, root cause, and corrective actions
   - Update runbooks and preventive measures
   - Share learnings organization

### Escalation Paths
- **Follow-up**:
     - Track corrective actions to completion
     - Monitor for recurrence
     - Update risk assessments if needed

## Performance Benchmarks for Deployment
### Pre-Deployment Targets (Staging)
- **Page Load (FCP)**: < 1.5 seconds on 3G
- **Time to Interactive**: < 2.5 seconds on 3G
- **First Input Delay**: < 50ms
- **Cumulative Layout Shift**: < 0.1
- **Largest Contentful Paint**: < 2.0 seconds on 3G
- **Total Blocking Time**: < 150ms
- **Draw Latency (Pencil)**: < 30ms from input to visual
- **Draw Latency (Touch)**: < 40ms from input to visual
- **Frame Rate During Drawing**: >45fps sustained
- **Memory Leak Test**: < 5MB growth over 10 minutes
- **Bundle Size**: < 150KB gzipped for initial load
- **API Response Time (p95)**: < 200ms
- **Error Rate**: < 0.1% of requests

### Production Acceptance Criteria
- **Error Rate Increase**: < 50% of baseline
- **Latency Increase (p95)**: < 25% of baseline
- **Conversion Funnel Drop**: < 10% for critical paths
- **Crash Rate**: < 0.05% of sessions
- **User Feedback**: No significant increase in complaints
- **Business Metrics**: No significant deviation from forecast
- **Security**: No new vulnerabilities introduced
- **Compliance**: No violations introduced

## Continuous Deployment Considerations
While we currently use a scheduled release cadence, we evaluate moving toward more continuous deployment:

### Requirements for Increased Deployment Frequency
1. **Improved Test Automation**: Higher confidence in catching issues pre-production
2. **Enhanced Observability**: Faster detection and diagnosis of issues
3. **Faster Rollback Capability**: Near-instantaneous recovery
4. **Reduced Change Size**: Smaller, less risky changes
5. **Strong Feature Flag Infrastructure**: Safe testing in production
6. **Cultural Readiness**: Team confidence in rapid iteration

### Benefits of Increased Deployment Frequency
- **Faster Feedback**: Learn from users more quickly
- **Reduced Risk Per Deployment**: Smaller changes = less to go wrong
- **Improved Developer Experience**: Less context switching, faster feedback
- **Higher Reliability**: Through practice and automation
- **Better Alignment with User Needs**: Respond faster to feedback
- **Reduced Deployment Anxiety**: Through familiarity and competence

### Challenges of Increased Deployment Frequency
- **Increased Operational Overhead**: More releases to manage
- **Need for Sophisticated Monitoring**: To detect issues quickly
- **Potential for User Fatigue**: If changes are too frequent or disruptive
- **Integration Complexity**: With business cycles and support schedules
- **Requirement for High Test Coverage**: To maintain confidence
- **Need for Excellent Trunk Health**: Main branch must always be deployable

### Our Path Forward
1. **Short Term**: Maintain current cadence while improving automation
2. **Mid Term**: Increase to bi-weekly releases as confidence grows
3. **Long Term**: Move to continuous deployment for low-risk changes
4. **Always**: Maintain ability to deploy emergency fixes rapidly

## Integration with Other Systems
### Third-Party Service Deployments
When Papyr integrates with external services:
- **Authentication Providers**: Google, GitHub, etc. (managed via Supabase)
- **Payment Processors**: Stripe, PayPal (future)
- **Analytics**: Google Analytics, Mixpanel (future)
- **Customer Support**: Zendesk, Intercom (future)
- **Marketing**: Mailchimp, HubSpot (future)
- **CRM**: Salesforce, HubSpot (future)
- **ERP/Accounting**: QuickBooks, Xero (future)

Each integration requires:
- **Credential Management**: Secure storage of API keys/secrets
- **Environment Specific Configuration**: Test vs production keys
- **Rate Limiting Awareness**: To avoid hitting limits
- **Fallback Handling**: Graceful degradation when service unavailable
- **Data Mapping**: Clear understanding of what data flows where
- **Compliance Review**: Ensuring data handling meets regulations

### Internal Tool Deployments
Internal tools supporting Papyr development:
- **CI/CD Systems**: GitHub Actions (managed via repository settings)
- **Monitoring**: Grafana, Prometheus, Sentry
- **Logging**: ELK stack, Datadog
- **Project Management**: Jira, Trello, Asana
- **Documentation**: Notion, Confluence, Confluence
- **Communication**: Slack, Email, Zoom
- **Design**: Figma, Adobe Creative Suite
- **Development**: VS Code, JetBrains, Terminals

These are largely managed services with their own update cycles.

## Specialized Deployment Scenarios

### Database Migration Deployment
When schema changes are required:
1. **Preparation**:
   - Write backward-compatible migration where possible
   - Test migration against copy of production data
   - Estimate downtime and impact
   - Prepare rollback scripts (downgrade migrations)
   - Notify stakeholders of expected maintenance window
2. **Execution**:
   - Schedule during low-usage period
   - Put system in maintenance mode (if applicable)
   - Run migration scripts
   - Validate success via checks and spot checks
   - Take system out of maintenance mode
3. **Validation**:
   - Check application functionality
   - Verify data integrity
   - Monitor for anomalies
   - Confirm with stakeholders
4. **Post-Migration**:
   - Monitor performance and query patterns
   - Optimize indexes if needed
   - Document lessons learned

### Certificate Rotation
For TLS/SSL certificates:
- **Automated Renewal**: Let's Encrypt via certbot (if self-managing certs)
- **Provider-Managed**: Vercel and Supabase handle their own certs
- **Custom Domains**: Certificates renewed before expiration
- **Validation**: Test after renewal to ensure no interruption
- **Documentation**: Track expiration dates and renewal procedures

### Data Center or Region Migration
If we ever need to move providers or regions:
1. **Assessment**: Evaluate target environment compatibility
2. **Planning**:
   - Map all dependencies and integrations
   - Plan data transfer strategy (replication, export/import)
   - Plan DNS cutover strategy
   - Prepare rollback plan
   - Test in staging environment
3. **Execution**:
   - Begin replication or data transfer
   - Cut over DNS with appropriate TTL
   - Monitor for anomalies and errors
   - Validate functionality and performance
   - Decommission source environment
4. **Validation**:
   - Confirm data integrity and completeness
   - Validate application functionality
   - Monitor for latent issues
   - Document lessons learned

## Glossary of Deployment Terms
- **Atomic Deployment**: Deployment that either fully succeeds or fully fails, with no partial state
- **Blue/Green Deployment**: Strategy using two identical production environments
- **Canary Release**: Releasing to a subset of users before full rollout
- **Continuous Deployment**: Automatically deploying every change that passes tests to production
- **Continuous Delivery**: Software can be released to production at any time
- **Deploy Hook**: Script that runs before or after deployment
- **Environment Promotion**: Moving a release from one environment to another (test → staging → prod)
- **Feature Flag**: Technique to toggle features without deploying new code
- **Fortran**: Not applicable (included to test if you're reading)
- **Immutable Infrastructure**: Servers are never modified after creation
- **Infrastructure as Code (IaC)**: Managing infrastructure via code
- **Lift and Shift**: Moving application to new environment with minimal changes
- **Merge Window**: Time period when code can be merged to main branch
- **Rollback**: Reverting to a previous known good state
- **Semantic Versioning**: Versioning scheme conveying meaning about changes
- **Shifting Left**: Performing activities earlier in the lifecycle (e.g., testing)
- **Shifting Right**: Performing activities later in the lifecycle (e.g., monitoring in production)
- **Smoke Test**: Preliminary test to reveal simple failures
- **Trunk-Based Development**: Developers merge small updates to main branch frequently
- **Zero Downtime Deployment**: Deployment without noticeable service interruption

## Document Control
- **Owner**: DevOps Lead
- **Reviewers**: Tech Lead, Product Lead, QA Lead
- **Review Cycle**: Quarterly or after major process changes
- **Version**: 1.0.0
- **Last Updated**: 2026-07-31
- **Next Review**: 2026-10-31
*This document is classified as Internal Use Only*