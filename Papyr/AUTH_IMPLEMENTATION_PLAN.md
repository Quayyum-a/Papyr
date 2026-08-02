# Papyr Authentication Implementation Plan

**Version:** 1.0  
**Date:** 2026-08-02  
**Based on:** Complete Authentication Audit (Task #19)

---

## 📋 Executive Summary

The current authentication implementation has a solid foundation but lacks production readiness. Key gaps include:
- No `/auth/callback` route for email verification
- Email verification redirects to localhost
- No custom email templates (using generic Supabase emails)
- Missing production URL detection for redirects
- Incomplete error handling with user-friendly messages
- Missing comprehensive test coverage (E2E, integration, edge cases)
- Missing Supabase callback route for email verification
- Inconsistent error handling with generic Supabase errors
- Missing password strength validation
- No password reset implementation
- Missing OTP/OTP-based magic link authentication
- Incomplete session management (no refresh token handling)

---

## 🔍 Current State Audit Summary

### ✅ Working
- Supabase client (browser & server) with mock fallbacks
- AuthContext with signUp, signIn, signOut, updateProfile
- Middleware protection for `/dashboard`, `/profile`
- SignUpForm with basic validation (email, password, confirm)
- LoginForm with email/password
- Google OAuth button (UI only)
- Profile component with display name editing
- Basic session management via AuthContext
- Middleware route protection
- Basic tests for SignUpForm and LoginForm

### ❌ Missing / Broken
| Area | Status | Priority |
|------|--------|----------|
| `/auth/callback` route | ❌ Missing | **CRITICAL** |
| Email verification redirect | Points to localhost | **CRITICAL** |
| Custom email templates | Using default Supabase | **HIGH** |
| Password reset flow | UI only, no logic | **HIGH** |
| Production URL detection | Hardcoded fallback | **HIGH** |
| Custom email templates | None configured | **HIGH** |
| Password strength meter | Missing | **MEDIUM** |
| Error handling | Generic Supabase errors | **HIGH** |
| E2E auth flow tests | Missing | **HIGH** |
| Middleware URL detection | Hardcoded localhost | **MEDIUM** |
| Password strength meter | Missing | **MEDIUM** |
| Magic link / OTP auth | Missing | **MEDIUM** |
| Session refresh handling | Basic only | **MEDIUM** |
| CSRF protection | Not implemented | **MEDIUM** |
| Rate limiting | Not implemented | **MEDIUM** |

---

## 🎯 Implementation Plan

### Phase 1: Core Authentication Infrastructure (Week 1)

#### 1.1 Environment & Configuration
- [ ] Add `NEXT_PUBLIC_APP_URL` to all environments
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` for admin operations (server-only, non-public secret, fail-closed when missing)
- [ ] Create environment validation utility
- [ ] Add URL detection utility (dev/preview/production)

#### 1.2 Auth Callback Route (`/auth/callback`)
- [ ] Create `/src/app/auth/callback/route.ts` (Server Route)
- [ ] Handle `code` parameter exchange for session
- [ ] Handle `next` parameter for post-login redirect
- [ ] Handle error states (expired, invalid, already verified)
- [ ] Redirect to dashboard on success
- [ ] Redirect to login with error on failure

#### 1.3 Email Verification Flow
- [ ] Update Supabase email template (custom HTML)
- [ ] Configure redirect URL to production callback
- [ ] Add email template with Papyr branding
- [ ] Test email delivery in staging

#### 1.4 Production URL Detection
- [ ] Create `lib/utils/url.ts` utility
- [ ] Auto-detect: localhost → preview → production
- [ ] Export `getAppUrl()` for use in auth flows
- [ ] Update all hardcoded URLs

### Phase 2: Auth Flow Hardening (Week 1-2)

#### 2.1 Signup Flow Hardening
- [ ] Add password strength meter (zxcvbn or custom)
- [ ] Real-time validation feedback
- [ ] Duplicate email handling with friendly message
- [ ] Full name field in signup form
- [ ] Server-side duplicate email check
- [ ] Rate limiting on signup endpoint

#### 2.2 Login Flow Hardening
- [ ] Remember me option
- [ ] Failed attempt tracking (rate limiting)
- [ ] Account lockout after N failed attempts
- [ ] "Remember me" extends session

#### 2.3 Error Handling Overhaul
- [ ] Create error code → user message mapping
- [ ] Never expose Supabase error codes/messages
- [ ] Add error boundaries for auth flows
- [ ] Toast/notification system for auth errors

#### 2.3 Session Management
- [ ] Refresh token handling
- [ ] Session persistence across tabs
- [ ] Automatic token refresh
- [ ] Secure cookie settings (HttpOnly, Secure, SameSite)
- [ ] Session expiry warnings

### Phase 3: Auth Features (Week 2)

#### 3.1 Password Reset Flow
- [ ] `/auth/reset-password` page (complete implementation)
- [ ] `/auth/callback` handles password reset tokens
- [ ] Custom reset password email template
- [ ] Token expiry handling (1 hour default)
- [ ] New password validation

#### 3.2 Magic Link / OTP Authentication
- [ ] `/auth/magic-link` page
- [ ] Email-based OTP login
- [ ] 6-digit code with 10-min expiry
- [ ] Fallback to password login

#### 3.3 OAuth Providers
- [ ] Google OAuth (complete implementation)
- [ ] GitHub OAuth
- [ ] Apple OAuth (optional)
- [ ] Account linking for existing users

#### 3.4 Profile & Account Management
- [ ] Email change with verification
- [ ] Password change (current + new + confirm)
- [ ] Avatar upload (Supabase Storage)
- [ ] Account deletion with confirmation

### Phase 4: Security Hardening (Week 2-3)

#### 4.1 Security Headers & Cookies
- [ ] Secure cookie settings (HttpOnly, Secure, SameSite=Lax)
- [ ] CSRF protection (double-submit cookie pattern)
- [ ] Rate limiting on auth endpoints
- [ ] JWT validation in middleware
- [ ] Secure headers (CSP, HSTS, X-Frame-Options)

#### 4.2 Session Security
- [ ] Short-lived access tokens (15 min)
- [ ] Long-lived refresh tokens (7 days)
- [ ] Automatic token rotation
- [ ] Session revocation on password change
- [ ] Concurrent session limits

#### 4.3 Audit & Monitoring
- [ ] Auth event logging (login, signup, failures)
- [ ] Failed attempt alerting
- [ ] Session anomaly detection
- [ ] Audit log for admin actions

### Phase 5: Testing & Quality (Week 3)

#### 5.1 Unit Tests (Target: 90% coverage)
- [ ] AuthContext methods
- [ ] SignUpForm validation
- [ ] LoginForm validation
- [ ] Password strength utility
- [ ] Error message mapping
- [ ] URL utilities
- [ ] Auth hooks

#### 5.2 Integration Tests
- [ ] Signup → Email → Callback → Dashboard
- [ ] Login → Dashboard → Refresh → Logout
- [ ] Password reset flow
- [ ] Magic link flow
- [ ] OAuth flow
- [ ] Session refresh
- [ ] Expired token handling

#### 5.3 E2E Tests (Playwright)
- [ ] Complete signup flow
- [ ] Complete login flow
- [ ] Password reset flow
- [ ] Email verification
- [ ] Session persistence
- [ ] Logout & re-login
- [ ] Protected route access
- [ ] Session expiry
- [ ] Concurrent sessions

#### 5.4 Security Tests
- [ ] SQL injection attempts
- [ ] XSS in auth forms
- [ ] CSRF token validation
- [ ] Rate limiting enforcement
- [ ] Session fixation
- [ ] Token replay attacks

### Phase 6: Supabase Configuration & Deployment (Week 3)

#### 6.1 Supabase Dashboard Configuration
- [ ] Site URL: `https://papyr-app-mu.vercel.app`
- [ ] Redirect URLs: `https://papyr-app-mu.vercel.app/auth/callback`
- [ ] Email templates: Custom HTML templates
- [ ] SMTP configuration (if custom)
- [ ] JWT expiry: 15 min access / 7 days refresh
- [ ] Enable email confirmations
- [ ] Disable email confirmations in dev (optional)
- [ ] Rate limits: 60 req/min signup, 120 req/min login
- [ ] Enable leaked password protection
- [ ] Enable MFA (optional for users)

#### 6.2 Database
- [ ] Profiles table with RLS
- [ ] Automatic profile creation trigger
- [ ] RLS policies for all tables
- [ ] Updated_at triggers
- [ ] Proper indexes

#### 6.3 Vercel Deployment
- [ ] Environment variables in Vercel
- [ ] Preview deployments
- [ ] Production deployment
- [ ] Custom domain setup
- [ ] SSL/TLS verification

---

## 📦 File Structure Changes

```
src/
├── app/
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts              # NEW: Supabase callback handler
│   │   ├── callback/
│   │   │   └── page.tsx              # NEW: Callback UI
│   │   ├── callback/
│   │   │   └── page.tsx              # NEW: Callback UI
│   │   ├── magic-link/
│   │   │   └── page.tsx              # NEW: Magic link auth
│   │   ├── callback/
│   │   │   └── page.tsx              # NEW: Callback UI
│   │   ├── reset-password/
│   │   │   └── page.tsx              # ENHANCED: Complete flow
│   │   ├── signup/
│   │   │   └── page.tsx              # ENHANCED
│   │   └── login/
│   │       └── page.tsx              # ENHANCED
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts              # NEW: Supabase callback handler
│   │   └── ...
├── components/
│   ├── auth/
│   │   ├── SignUpForm.tsx            # ENHANCED
│   │   ├── LoginForm.tsx             # ENHANCED
│   │   ├── PasswordStrengthMeter.tsx # NEW
│   │   ├── AuthErrorDisplay.tsx      # NEW
│   │   ├── MagicLinkForm.tsx         # NEW
│   │   └── ...
│   └── ...
├── components/
│   ├── ui/
│   │   ├── Toast.tsx                 # NEW: Toast notifications
│   │   ├── ErrorBoundary.tsx         # NEW
│   │   └── ...
├── lib/
│   ├── auth/
│   │   ├── auth-utils.ts             # NEW: Error mapping, validation
│   │   ├── password.ts               # NEW: Strength, validation
│   │   ├── session.ts                # NEW: Session utilities
│   │   ├── cookies.ts                # NEW: Cookie utilities
│   │   └── rate-limit.ts             # NEW: Rate limiting
│   ├── supabase/
│   │   ├── client.ts                 # ENHANCED
│   │   ├── server.ts                 # ENHANCED
│   │   └── admin.ts                  # NEW: Admin operations
│   ├── utils/
│   │   ├── url.ts                    # NEW: URL utilities
│   │   ├── env.ts                    # NEW: Env validation
│   │   └── csrf.ts                   # NEW: CSRF protection
│   └── ...
├── middleware.ts                      # ENHANCED
├── app/
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts              # NEW: Server-side callback handler
│   │   └── ...
│   └── ...
├── middleware.ts                      # ENHANCED
└── tests/
    ├── unit/
    │   ├── auth/
    │   │   ├── sign-up.test.ts       # NEW
    │   │   ├── login.test.ts         # NEW
    │   │   ├── password.test.ts      # NEW
    │   │   ├── session.test.ts       # NEW
    │   │   ├── error-mapping.test.ts # NEW
    │   │   └── url.test.ts           # NEW
    │   └── ...
    ├── integration/
    │   ├── auth-flow.test.ts         # NEW
    │   ├── password-reset.test.ts    # NEW
    │   ├── magic-link.test.ts        # NEW
    │   └── oauth.test.ts             # NEW
    └── e2e/
        ├── auth-flow.spec.ts         # NEW
        ├── password-reset.spec.ts    # NEW
        ├── magic-link.spec.ts        # NEW
        └── session.spec.ts           # NEW
```

---

## 🧪 Test Strategy

### Test Categories & Targets

| Test Type | Target Coverage | Tools |
|-----------|----------------|-------|
| Unit | 90% | Vitest + React Testing Library |
| Integration | 80% | Vitest + Supabase Mock |
| E2E | Critical paths | Playwright |
| Security | 100% critical paths | Custom + OWASP ZAP |

### Test Files to Create

| File | Type | Description |
|------|------|-------------|
| `tests/unit/auth/sign-up.test.ts` | Unit | Signup validation, submission |
| `tests/unit/auth/login.test.ts` | Unit | Login validation, submission |
| `tests/unit/auth/password.test.ts` | Unit | Strength, validation, reset |
| `tests/unit/auth/session.test.ts` | Unit | Session management |
| `tests/unit/auth/error-mapping.test.ts` | Unit | Error code → message |
| `tests/unit/auth/url.test.ts` | Unit | URL utilities |
| `tests/integration/auth-flow.test.ts` | Integration | Full auth flows |
| `tests/integration/password-reset.test.ts` | Integration | Password reset flow |
| `tests/integration/magic-link.test.ts` | Integration | Magic link flow |
| `tests/integration/oauth.test.ts` | Integration | OAuth flows |
| `tests/e2e/auth-flow.spec.ts` | E2E | Complete user journeys |
| `tests/e2e/password-reset.spec.ts` | E2E | Password reset |
| `tests/e2e/magic-link.spec.ts` | E2E | Magic link |
| `tests/e2e/session.spec.ts` | E2E | Session persistence |

---

## 🔐 Supabase Configuration Checklist

### Authentication Settings
| Setting | Value | Location |
|---------|-------|----------|
| Site URL | `https://papyr-app-mu.vercel.app` | Authentication → Settings |
| Redirect URLs | `https://papyr-app-mu.vercel.app/auth/callback` | Authentication → Settings |
| Email Confirmations | Enabled | Authentication → Providers → Email |
| Email Confirmations (Dev) | Disabled (optional) | Authentication → Providers → Email |
| Email Template | Custom HTML | Authentication → Templates |
| SMTP | Configure if custom | Authentication → SMTP |
| JWT Expiry (Access) | 15 minutes | Authentication → Settings |
| JWT Expiry (Refresh) | 7 days | Authentication → Settings |
| Leaked Password Protection | Enabled | Authentication → Settings |
| MFA | Optional (user choice) | Authentication → Settings |

### Email Templates

#### Confirmation Email
```html
<!-- Subject: Welcome to Papyr — Verify your email -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e2e8f0;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <svg width="48" height="48" viewBox="0 0 48 48" style="margin: 0 auto;">
        <!-- Papyr logo SVG -->
      </svg>
    </div>
    
    <h1 style="color: #0f172a; font-size: 28px; font-weight: 700; margin-bottom: 16px; text-align: center;">
      Welcome to Papyr
    </h1>
    
    <p style="color: #475569; font-size: 16px; margin-bottom: 24px; text-align: center;">
      Before you begin using your notebooks, please verify your email address.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-decoration: none;">
        Verify Email
      </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 24px;">
      If you didn't create this account, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      Papyr — Handwritten Digital Ledger<br>
      Small Businesses First
    </p>
  </div>
</body>
</html>
```

#### Password Reset Email
```html
<!-- Subject: Reset your Papyr password -->
<!-- Similar structure with {{ .ConfirmationURL }} for reset link -->
```

#### Magic Link Email
```html
<!-- Subject: Your Papyr sign-in link -->
<!-- Contains 6-digit code or magic link -->
```

---

## 🚀 Implementation Order

### Week 1: Foundation
1. ✅ Environment & URL utilities
2. ✅ `/auth/callback` route (Server + Client)
3. ✅ Production URL detection
4. ✅ Email verification redirect fix
5. ✅ Custom email templates (configure in Supabase)
5. ✅ Signup form enhancements (name field, password strength)
6. ✅ Error handling overhaul
6. ✅ Basic tests for new code

### Week 2: Features & Hardening
1. Password reset flow (complete)
2. Magic link / OTP authentication
3. OAuth providers (Google, GitHub)
3. Profile management (avatar, email change, password change)
4. Security hardening (CSRF, rate limiting, secure cookies)
4. Session management enhancements
5. Comprehensive test suite

### Week 3: Testing & Deployment
5. Unit tests (90% coverage)
5. Integration tests
5. E2E tests (Playwright)
5. Security audit
5. Supabase configuration
5. Vercel deployment verification
5. Documentation

---

## 📝 Acceptance Criteria Checklist

### Signup Flow
- [ ] User enters name, email, password, confirm
- [ ] Real-time validation (email format, password strength, match)
- [ ] Duplicate email → "This email is already registered"
- [ ] Weak password → "Password must contain..."
- [ ] Success → "Check your email to verify"
- [ ] Email sent with custom Papyr template
- [ ] Link redirects to `/auth/callback`
- [ ] Callback verifies, creates session, redirects to dashboard
- [ ] Profile auto-created in database

### Login Flow
- [ ] Email + password
- [ ] Invalid credentials → "Invalid email or password"
- [ ] Success → Dashboard
- [ ] Session persists across refresh/tabs
- [ ] "Remember me" extends session

### Password Reset
- [ ] Request reset → "Check your email"
- [ ] Email with reset link
- [ ] Link → `/auth/callback?type=recovery`
- [ ] New password form (strength meter)
- [ ] Success → "Password updated" → Login

### Session Management
- [ ] Survives refresh
- [ ] Survives browser restart
- [ ] Survives multiple tabs
- [ ] Auto-refresh before expiry
- [ ] Logout clears all sessions
- [ ] Password change revokes other sessions

### Security
- [ ] No Supabase errors exposed
- [ ] Rate limited (signup: 60/min, login: 120/min)
- [ ] CSRF protected
- [ ] Secure cookies (HttpOnly, Secure, SameSite=Lax)
- [ ] CSP headers
- [ ] Rate limiting on auth endpoints

### Testing
- [ ] Unit tests > 90%
- [ ] Integration tests pass
- [ ] E2E tests pass (signup, login, reset, verify)
- [ ] Security tests pass
- [ ] Coverage > 80%

### Deployment
- [ ] Vercel build succeeds
- [ ] Preview deployment works
- [ ] Production deployment works
- [ ] Supabase config correct
- [ ] Custom domain works
- [ ] SSL/TLS valid

---

## 📅 Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Foundation | Auth callback, email verification, URL detection, signup/login hardening, basic tests |
| 2 | Features | Password reset, magic link, OAuth, profile management, security hardening |
| 3 | Quality | Test suite (unit/integration/E2E), security audit, Supabase config, deployment |

---

## 📚 Documentation to Produce

1. **Architecture Decision Records** (ADRs)
   - ADR-001: Auth architecture
   - ADR-002: Session management
   - ADR-003: Email verification flow

2. **Developer Documentation**
   - Architecture overview
   - Auth flow diagrams
   - Environment setup guide
   - Troubleshooting guide

3. **Operations**
   - Deployment checklist
   - Supabase configuration guide
   - Incident response runbook
   - Monitoring & alerting setup

---

## ✅ Definition of Done

A feature is **done** when:
- [ ] Implementation complete
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass (where applicable)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Build succeeds
- [ ] Preview deployment works
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Merged to main via PR

---

**Approval Required:** Tech Lead + Security Review before merge to main.