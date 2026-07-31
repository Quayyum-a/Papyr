# ENVIRONMENT.md

## Environment Overview
This document describes the different environments used in the Papyr development lifecycle, their purposes, configurations, and access procedures.

## Environment Summary

| Environment | Purpose | Stability | Data | Access | Update Frequency |
|-------------|---------|-----------|------|--------|------------------|
| Development | Local coding & testing | Unstable | Synthetic/Local | Individual developers | Continuous |
| Testing | Automated CI/CD checks | Stable | Synthetic | CI Systems | On every commit |
| Staging | Pre-production validation | Stable | Anonymized Prod-like | Team & Stakeholders | After main branch deploy |
| Production | Live user serving | Stable | Production Data | Public (with auth) | On release |

## Development Environment

### Purpose
Individual developer workspace for coding, debugging, and initial testing.

### Characteristics
- **Installed Locally**: On each developer's machine
- **Data**: Local IndexedDB, mocked APIs, or local Supabase instance
- **Services**: 
  - Localhost web server (Next.js dev server)
  - Local Supabase (via Docker) OR mocked services
  - Local development databases (if needed)
- **Configuration**: 
  - Environment variables pointing to local/dev services
  - Hot module replacement enabled
  - Source maps enabled
  - ESLint and TypeScript strict mode active
- **Access**: 
  - URL: http://localhost:3000 (or assigned port)
  - Authentication: Local test accounts or mocked auth
- **Reset Procedure**: 
  - Clear localStorage and IndexedDB
  - Restart development server
  - Reset local Supabase instance (if used)

### Setup Instructions
1. Clone repository
2. Install dependencies: `npm ci`
3. Copy `.env.example` to `.env.local` and configure for local development
4. Start Supabase locally: `docker-compose up -d` (if using local Supabase)
5. Start development server: `npm run dev`
6. Run tests: `npm test`

### Configuration Files
- `.env.local`: Local environment variables (not committed)
- `jest.config.js`: Testing configuration
- `vitest.config.js`: Vite test configuration
- Various IDE settings (`.vscode/settings.json`)

## Testing Environment (CI/CD)

### Purpose
Automated validation of code changes before integration.

### Characteristics
- **Ephemeral**: Created fresh for each workflow run
- **Data**: Fully mocked or using temporary test databases
- **Services**:
  - Node.js runtime (specified version)
  - Test databases (PostgreSQL in Docker containers)
  - Mock external services (MSW for APIs)
  - Headless browsers (Chromium, Firefox, WebKit via Playwright)
- **Configuration**:
  - Environment variables from GitHub Secrets
  - No caching between runs (except dependency cache)
  - Parallel test execution where possible
- **Access**: 
  - Internal only (GitHub Actions runners)
  - Accessible via workflow logs and artifacts
- **Lifetime**: 
  - Starts with workflow trigger
  - Ends when workflow completes (success or failure)

### Processes
- **Trigger**: Push to any branch or pull request
- **Steps**:
  1. Checkout code
  2. Setup Node.js and cache dependencies
  3. Install dependencies (`npm ci`)
  4. Run linting (`npm run lint`)
  5. Run type checking (`npm run type-check`)
  6. Run unit tests with coverage (`npm test:coverage`)
  7. Build application (`npm run build`)
  8. Run end-to-end tests (`npm test:ehr`)
  9. Upload artifacts (test reports, coverage, build)
  10. Notify on failure (Slack/email)

### Key Features
- **Isolation**: No shared state between workflow runs
- **Security**: Secrets masked in logs
- **Resource Limits**: Defined by GitHub runner specifications
- **Artifact Persistence**: Test reports and builds available for download

## Staging Environment

### Purpose
Pre-production validation with realistic data and conditions.

### Characteristics
- **Persistent**: Long-running environment
- **Data**: 
  - Anonymized copy of production data (refreshed weekly)
  - Or synthetic dataset designed to mimic production distribution
  - PII removed or pseudonymized
- **Services**:
  - Frontend: Deployed to Vercel preview environment
  - Backend: Separate Supabase project (staging project)
  - Third-party services: Test/sandbox modes where available
  - Monitoring: Instrumented but alerts routed to team channels
- **Configuration**:
  - Environment variables from Vercel and GitHub secrets
  - Feature flags set for testing upcoming releases
  - Debug logging enabled at info level
  - Error reporting to Sink (with sampling)
- **Access**:
  - URL: Staging-specific Vercel deployment (e.g., `papyr-staging.vercel.app`)
  - Authentication: 
    - Open invitation for team members
    - Optional: SSO or email whitelist for external stakeholders
  - Administrative access: Limited to DevOps and tech leads
- **Update Frequency**:
  - Automatic: On every push to main branch (after CI passes)
  - Manual: On-demand redeploy for hotfix testing
  - Data refresh: Weekly (Sunday 02:00 UTC)

### Promotion Criteria
To be promoted from Staging to Production:
1. All automated tests pass in CI
2. Manual smoke test passes
3. Performance benchmarks met (no >5% regression)
4. Security scan shows no new high/critical vulnerabilities
5. Feature flags validated for intended behavior
6. Rollback plan tested and ready
7. Stakeholder sign-off obtained (Product Lead)

### Maintenance
- **Weekly**: Data refresh and dependency updates
- **Monthly**: Full infrastructure review
- **After Major Incidents**: Post-mortem and corrective actions
- **As Needed**: Scaling adjustments based on observed load

## Production Environment

### Purpose
Live service serving real users with real data.

### Characteristics
- **High Availability**: Designed for 99.9% uptime
- **Data**: Real user data with full fidelity
- **Services**:
  - Frontend: Deployed to Vercel production
  - Backend: Production Supabase project
  - Third-party services: Production APIs and webhooks
  - Monitoring: Full observability stack (metrics, logs, traces)
  - Backup: Automated daily backups with point-in-time recovery
  - CDN: Global edge caching via Vercel Edge Network
- **Configuration**:
  - Environment variables from Vercel and GitHub Secrets (production scope)
  - Feature flags: Majority off, selective rollouts via percentage
  - Error reporting: Full sampling to Sentry
  - Logging: Structured JSON to external service
  - Performance monitoring: Web Vitals collected and aggregated
- **Access**:
  - URL: `https://papyr.app` (custom domain)
  - Authentication: 
    - Public registration (email/password)
    - Social login (Google, GitHub - configured in Supabase)
    - Enterprise SSO (SAML/OIDC - future)
  - Administrative access: 
    - Super admin role (limited to founders/CTO)
    - Moderator role (trusted community members)
    - Support agent role (limited PII access)
  - API Access: 
    - Authenticated endpoints require valid JWT
    - Rate limiting applied per IP and user
- **Update Frequency**:
  - **Patch Releases**: As needed for critical fixes (goal: <4 hours from fix to deploy)
  - **Minor Releases**: Weekly (every Tuesday) for non-critical improvements
  - **Major Releases**: Every 8-10 weeks (aligned with product phases)
  - **Emergency**: Immediate for security or critical data issues

### Release Process
1. **Pre-Release**:
   - Feature branch merged to main after PR approval
   - CI pipeline runs successfully
   - Automated deploy to staging
   - Manual verification in staging
   - Release notes prepared
   - Rollback procedures verified
2. **Release**:
   - Tag commit with version number (semver: vMAJOR.MINOR.PATCH)
   - Trigger production deploy via Vercel (or manual if needed)
   - Monitor deployment progress and health checks
   - Post-deploy smoke test
   - Announce to team and stakeholders
3. **Post-Release**:
   - Monitor key metrics for 1 hour, then 4 hours, then 24 hours
   - Check error rates, performance, and business metrics
   - Respond to user feedback and support tickets
   - Document any issues or observations
4. **Rollback** (if needed):
   - Initiate rollback to previous version via Vercel
   - Verify rollback completion
   - Investigate root cause of failure
   - Schedule fix for next release or emergency patch

### Monitoring & Observability
#### Metrics (Collected via Prometheus/Grafana or equivalent)
- **Infrastructure**: CPU, memory, disk, network usage per service
- **Application**: Request rates, error rates, latency distributions (p50, p95, p99)
- **Business**: Active users, session duration, conversion funnel steps
- **User Experience**: Web Vitals (LCP, FID, CLS), custom timers
- **Database**: Query performance, connection pool usage, replication lag

#### Logging
- **Structured**: JSON format with consistent fields
- **Levels**: 
  - Error: Something went wrong requiring attention
  - Warn: Potentially problematic situation
  - Info: Normal operational information
  - Debug: Detailed information for troubleshooting
- **Destinations**:
  - Local file (rotated)
  - External service (Elasticsearch, Splunk, or similar)
  - Standard output (captured by platform)

#### Alerting
- **Critical**: Page on-call engineer immediately (e.g., site down, error rate >5%)
- **Warning**: Notify within 30 minutes (e.g., degraded performance, elevated error rate)
- **Info**: Daily digest or ticket creation (e.g., new feature usage, low-priority issues)
- **Channels**: 
  - PagerDuty for critical alerts
  - Slack #alerts for warnings
  - Email for informational summaries

### Backup & Disaster Recovery
- **Backups**:
  - Automated daily snapshots of Supabase project
  - Point-in-time recovery (PITR) enabled for last 7 days
  - Manual backups before major schema changes
- **Recovery Procedures**:
  1. Identify point of failure or data corruption
  2. Determine recovery time objective (RTO) and point objective (RPO)
  3. Restore from appropriate backup or use PITR
  4. Validate data integrity
  5. Resume normal operations
  6. Conduct post-mortem
- **Disaster Recovery Site**: 
  - Not currently implemented (rely on provider redundancy)
  - Consider multi-region strategy for future scale

### Security Measures
- **Network**: 
  - TLS 1.3 enforced for all connections
  - DDoS protection via provider (Cloudflare/Vercel edge)
  - WAF rules for common attack patterns
- **Application**:
  - Input validation and sanitization
  - Output encoding to prevent XSS
  - CSRF protection where applicable (Stateless JWT reduces risk)
  - Rate limiting and brute force protection
  - Dependency scanning (Snyk/Dependabot)
- **Data**:
  - Encryption at rest (provided by Supabase)
  - Field-level encryption for sensitive data (future)
  - Access logging for all data access to sensitive information
  - Regular permission audits
- **Access Control**:
  - Principle of least privilege
  - Just-in-time access for administrative functions
  - Regular review of privileged accounts
  - Multi-factor authentication for administrative access

### Compliance & Auditing
- **Data Protection**: 
  - GDPR compliance framework implemented
  - Data processing agreements with all subprocessors
  - Regular DPIAs for new features
  - Privacy policy and terms of service updated regularly
- **Monitoring**:
  - Access logs retained for 1 year (per policy)
  - Security events logged and alerted
  - Regular third-party penetration testing
  - Vulnerability disclosure program (via HackerOne or similar)
- **Reporting**:
  - Incident reports within 72 hours of discovery
  - Annual compliance reports available to customers
  - Transparency reports for government requests (if applicable)

## Environment Variables
Each environment requires specific configuration. Below are the key variable categories:

### Required in All Environments
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_anon_key
```

### Development Specific (in .env.local)
```
# Optional local Supabase
LOCAL_SUPABASE_DB_PASSWORD=your_password
# Feature flags for development
NEXT_PUBLIC_FEATURE_NEW_TOOLS=true
NEXT_PUBLIC_FEATURE_ADVANCED_EXPORT=false
```

### Staging Specific (Set in Vercel/Project Settings)
```
# Staging Supabase (different project)
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging_public_anon_key
# Enable more verbose logging
NEXT_PUBLIC_LOG_LEVEL=debug
# Staging-specific feature flags
NEXT_PUBLIC_FEATURE_SHARE_LINKS=true
NEXT_PUBLIC_FEATURE_TEMPLATE_SUGGESTIONS=true
```

### Production Specific (Set in Vercel/Project Settings)
```
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_public_anon_key
# Production optimizations
NEXT_PUBLIC_LOG_LEVEL=info
# Feature flags (gradual rollout)
NEXT_PUBLIC_FEATURE_NEW_TOOLS=false
NEXT_PUBLIC_FEATURE_ADVANCED_EXPORT=false
# Monitoring keys
NEXT_PUBLIC_SENTRY_DSN=https://xxx@o0.ingest.sentry.io/yyyyyyy
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Data Flow Between Environments
```
Local Dev (Individual) 
     ↓ (git push)
CI/CD Testing (GitHub Actions) 
     ↓ (if passes)
Staging (Vercel Preview + Staging Supabase) 
     ↓ (manual promotion after validation)
Production (Vercel Prod + Prod Supabase) 
     ↓ (continuous monitoring)
Backup Storage (Daily Snapshots) 
     ← (periodic archival to long-term storage)
```

## Tools & Infrastructure

### Containerization (for Local Dev & CI)
- **Docker**: Used for local services (Supabase, databases)
- **docker-compose.yml**: Defines local development services
- **GitHub Actions**: Uses service containers for testing dependencies

### Infrastructure as Code
- **Vercel**: Configured via project settings and `vercel.json`
- **Supabase**: 
  - Project settings via UI/API
  - Migrations stored in `supabase/migrations/`
  - Seed data in `supabase/seed.sql` (if used)
- **Monitoring**: 
  - Alertmanager rules in version control
  - Dashboard definitions exported periodically
  - Sentry configuration via SDK initialization

### Network Topology
```
[User] 
   ↓ HTTPS (TLS 1.3)
[Vercel Edge Network] 
   ↓ HTTPS 
[Next.js API Routes or direct to Supabase)
[Supabase API Gateway] 
   ↓ PostgreSQL (with connection pooling)
[Supabase Storage] 
   ↓ Object Storage (S3-compatible)
[Optional Third-Party Services]
   ↓ Their respective APIs
```

## Naming Conventions
- **Environment Prefixes**: 
  - `dev-`, `test-`, `stg-`, `prod-` for resource naming where applicable
  - Avoid in user-facing domains
- **Resource Tags**: 
  - `environment=staging`
  - `team=papyr`
  - `project=papyr`
  - `cost-center=engineering`
- **Branch Naming**: 
  - `feature/` for new features
  - `fix/` for bug fixes
  - `refactor/` for code improvements
  - `release/` for release preparation
  - `hotfix/` for emergency production fixes

## Access Control & Security
### Authentication Methods
- **Development**: Local passwords, social login dev modes
- **Staging**: 
  - Email/password with invitation
  - Optional SSO for corporate access
  - Time-limited access tokens for automation
- **Production**: 
  - Email/password with MFA option
  - Social login (Google, GitHub)
  - Enterprise SAML/OIDC (future)
  - API keys for service-to-service (restricted scopes)

### Authorization Levels
```
Guest: 
  - View public landing page
  - Attempt registration

User (Authenticated):
  - Access own account and data
  - Create, read, update, own resources
  - Share resources with permission controls

Moderator:
  - All User permissions
  - View reported content
  - Apply basic content moderation
  - Assist users with common issues

Admin:
  - All Moderator permissions
  - Manage users and roles
  - Configure system-wide settings
  - Access audit logs
  - Emergency response capabilities

Super Admin (limited):
  - All Admin permissions
  - Access to billing and account management
  - Infrastructure-level operations
  - Breaking glass procedures
```

## Disaster Recovery Procedures
### Scenario 1: Regional Outage (Vercel or Supabase)
1. **Detection**: Monitoring alerts and health check failures
2. **Assessment**: Determine scope and estimated duration
3. **Communication**: 
   - Internal: Alert engineering lead
   - External: Status page update if >5min outage
4. **Mitigation**:
   - If partial: Route traffic to healthy regions
   - If complete: Prepare for failover (if implemented)
5. **Recovery**: 
   - Wait for provider resolution
   - Verify service restoration
   - Communicate resolution
6. **Post-Mortem**: Document and improve resilience

### Scenario 2: Data Corruption or Loss
1. **Detection**: Data inconsistency alerts, user reports, monitoring anomalies
2. **Assessment**: 
   - Determine scope (single user, multiple users, system-wide)
   - Identify time of corruption
   - Check backup availability
3. **Immediate Action**:
   - Suspend writes if ongoing corruption suspected
   - Notify affected users if appropriate
4. **Recovery**:
   - Identify clean recovery point
   - Restore from backup or use PITR
   - Validate data integrity
   - Resume operations
5. **Communication**:
   - Internal: Full incident report
   - External: Notify affected per data breach regulations if needed
6. **Prevention**: 
   - Implement additional checks
   - Improve monitoring
   - Update procedures

### Scenario 3: Security Breach
1. **Detection**: Alert from SIEM, unusual access patterns, user report
2. **Isolation**:
   - Disable compromised credentials
   - Block suspicious IPs
   - Preserve logs for forensics
3. **Assessment**:
   - Determine scope and data accessed
   - Identify attack vector
   - Check for persistence mechanisms
4. **Eradication**:
   - Remove malicious code/access
   - Patch vulnerabilities
   - Reset potentially compromised credentials
5. **Recovery**:
   - Restore clean systems if needed
   - Validate integrity
   - Return to normal operation
6. **Notification**:
   - Internal: Incident response team
   - External: Per legal requirements (timeline depends on jurisdiction)
   - Affected users: If their data was compromised
7. **Post-Incident**: 
   - Complete incident report
   - Update security controls
   - Conduct training if needed

## Performance Characteristics
### Targets by Environment
| Metric | Development | Testing | Staging | Production |
|--------|-------------|---------|---------|------------|
| Page Load (FCP) | < 3s* | < 2s | < 1.5s | < 1.2s (3G) |
| Time to Interactive | < 5s* | < 3s | < 2.5s | < 2s (3G) |
| Draw Latency | < 100ms | < 50ms | < 30ms | < 20ms |
| Error Rate | < 5% | < 1% | < 0.5% | < 0.1% |
| Crash Rate | < 5% | < 1% | < 0.5% | < 0.05% |

*Note: Development may be slower due to hot reloading and debugger overhead*

### Resource Utilization Targets
- **CPU**: < 70% average peak per instance
- **Memory**: < 80% of allocated
- **Disk I/O**: < 60% utilization
- **Network**: < 80% of bandwidth
- **Database Connections**: < 80% of pool limit
- **Cache Hit Ratio**: > 80% for read-heavy workloads

## Cost Optimization Strategies
### Compute Rightsizing
- Regularly review instance types and sizes
- Use auto-scaling groups where applicable
- Leverage spot/preemptible instances for batch workloads
- Right-size containers based on actual usage

### Storage Efficiency
- Implement data lifecycle policies
- Compress or archive old data
- Use appropriate storage classes (hot/warm/cold)
- Deduplicate where beneficial
- Optimize image and asset sizes

### Network Efficiency
- Enable HTTP/2 and HTTP/3 where possible
- Implement efficient caching strategies
- Optimize payload sizes (JSON compression, protobuf for internal APIs)
- Use CDNs for static assets
- Minimize third-party requests

### Licensing & Subscriptions
- Regularly review SaaS subscriptions
- Negotiate enterprise discounts where applicable
- Use open-source alternatives when functionally equivalent
- Monitor usage against tier limits to avoid overage charges

## Change Management
### Types of Changes
1. **Standard**: Pre-approved, low-risk changes (e.g., dependency updates)
2. **Normal**: Requires review and scheduled window (e.g., feature release)
3. **Emergency**: Immediate action required (e.g., security patch)

### Change Advisory Board (CAB)
- **Members**: Tech Lead, Product Lead, Security Lead, DevOps Lead
- **Meeting**: Weekly (or as needed for emergency)
- **Responsibilities**:
  - Review upcoming changes
  - Assess risk and impact
  - Approve or reject changes
  - Ensure proper communication and documentation
  - Review emergency changes post-facto

### Release Communication
- **Internal**: 
  - Slack #releases channel for deployment notifications
  - Email summary for non-engineering stakeholders
  - Post-release meeting for retrospectives
- **External**:
  - In-app notifications for user-facing changes
  - Email newsletter for major updates
  - Blog posts for significant features or technical deep dives
  - Status page for incidents and maintenance
  - Social media for public announcements

## Glossary
- **Blue/Green Deployment**: Technique to reduce downtime by running two identical production environments
- **Canary Release**: Rolling out changes to a small subset of users before full deployment
- **Feature Flag**: Technique to toggle features on/off without deploying new code
- **Infrastructure as Code (IaC)**: Managing infrastructure through machine-readable definition files
- **Mean Time To Recovery (MTTR)**: Average time to recover from a failure
- **Recovery Point Objective (RPO)**: Maximum targeted period in which data might be lost due to incident
- **Recovery Time Objective (RTO)**: Targeted time to restore service after a disruption
- **Service Level Agreement (SLA)**: Commitment between service provider and client
- **Service Level Indicator (SLI)**: Measured value of some aspect of service quality
- **Service Level Objective (SLO)**: Target value or range for a service level indicator
- **Shadow Testing**: Running production traffic through a new version without affecting users
- **Canary Analysis**: Comparing key metrics between canary and control groups
- **Immutable Infrastructure**: Approach where servers are never modified after deployment
- **Containers**: Lightweight, portable units for packaging and running applications
- **Orchestration**: Automated arrangement, coordination, and management of computer systems
- **Service Mesh**: Dedicated infrastructure layer for handling service-to-service communication
- **Observability**: Ability to understand internal state of a system from its external outputs
- **Telemetry**: Automatic measurement and transmission of data from remote sources
- **Distributed Tracing**: Method used to profile and monitor applications, especially those built using microservices
- **Chaos Engineering**: Discipline of experimenting on a system to build confidence in its capability to withstand turbulent conditions

## Document Control
- **Owner**: DevOps Lead
- **Reviewers**: Tech Lead, Product Lead, Security Lead
- **Review Cycle**: Quarterly or after major infrastructure changes
- **Version**: 1.0.0
- **Last Updated**: 2026-07-31
- **Next Review**: 2026-10-31
*This document is classified as Internal Use Only*