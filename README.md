# Kyddos V1

## Project Overview
- **Name**: Kyddos V1
- **Goal**: Build a V1 App Store-ready, family-safe, verified parent-to-parent playmate matching experience with limited nanny beta, Travel Mode, public safety feed, monetization gates, referral tracking, reporting/blocking, and admin moderation tools.
- **Source of Truth**: `Kyddos V1 Developer Build Packet.pdf` supplied by the user.
- **Platform in this sandbox**: Cloudflare Pages/Hono web implementation that simulates the complete mobile app experience and admin dashboard. This is not a native iOS/Android binary, but it is structured for handoff to native/mobile teams.

## Implemented Features
- Redesigned parent-facing visual system inspired by `kds.pdf`, with a warmer premium palette, softer cards, trust-focused onboarding, polished swipe-style discovery cards, parent safety cues, improved pricing cards, and a more app-store-friendly mobile aesthetic.
- Parent onboarding screens: welcome, how it works, safety first, sign up, login, email verification, phone verification, identity verification, approval pending.
- Parent profile wizard: parent basics, hosting preferences, parent style.
- Kydo profile wizard: avatar-only child profile, personality, interests, safety/comfort.
- Match preferences and Super Premium Time Out Box gating.
- Discover feed with family-safe language: Pass, Save, Request Playdate, Match, Message.
- 100-point Family Fit model using the packet weights:
  - Location/distance: 35
  - Child age/stage: 20
  - Interests/activities: 17
  - Safety/comfort: 10
  - Parent compatibility: 15
  - Hosting/logistics: 3
- Match labels: Excellent Fit, Strong Fit, Recommended, Partial Fit, Manual Browse Only.
- No-match empty state with: expand radius, lower threshold, manual browse, invite families, Travel Mode.
- Profile detail screen with pre-match privacy restrictions.
- Request Playdate flow with request limit checks and upgrade/credit prompt behavior.
- Incoming request, match confirmation, request tabs, matches, message list, and post-match chat thread.
- Admin message access rule: message review only when reported or safety-flagged.
- Manual Browse screen with required below-threshold label.
- Travel Mode add-on simulation with no child location tracking.
- Nanny beta landing, nanny profile setup, nanny detail, and nanny intro credit gate.
- Public safety/Amber Alert feed placeholder that only represents official/public feeds.
- Subscription and credit screen with Free/Premium/Super Premium gates and credit packs.
- Safety Center and Settings screens.
- Report and block API placeholders.
- Referral code backend tracking.
- Web admin dashboard with:
  - Pending approvals
  - Failed verifications
  - Manual review queue
  - Reported users
  - Flagged messages
  - Nanny beta queue
  - Subscription/credit tools
  - Referral tracking
  - Public safety feed status
  - Vendor verification status mapping
  - Admin audit log
  - User status controls API
  - Report review controls API

## Current Functional Entry URIs
- **Mobile/Admin SPA**: `/`
- **Bootstrap/current user state**: `/api/bootstrap`
- **Recommended discovery**: `/api/discover`
- **Manual browse**: `/api/discover?mode=manual`
- **Public profile detail**: `/api/profile/:userId`
- **Requests list**: `/api/requests`
- **Create request**: `POST /api/requests`
- **Update request**: `PATCH /api/requests/:id`
- **Matches**: `/api/matches`
- **Conversations**: `/api/conversations`
- **Conversation messages**: `/api/conversations/:id/messages`
- **Send message**: `POST /api/conversations/:id/messages`
- **Nanny listings**: `/api/nannies`
- **Nanny intro**: `POST /api/nannies/intro`
- **Nanny profile setup**: `POST /api/nanny-profile`
- **Public safety alerts**: `/api/safety-alerts`
- **Travel Mode**: `POST /api/travel-mode`
- **Subscription update**: `POST /api/subscribe`
- **Credits purchase simulation**: `POST /api/credits`
- **Report**: `POST /api/reports`
- **Block**: `POST /api/blocks`
- **Admin dashboard**: `/api/admin/dashboard`
- **Admin user status update**: `PATCH /api/admin/users/:id/status`
- **Admin report review**: `PATCH /api/admin/reports/:id`
- **Data model summary**: `/api/data-model`

## Data Architecture
### Data Models
Implemented in TypeScript demo stores and an integration-ready D1 migration:
- Users
- Verification statuses
- Parent profiles
- Kydo profiles
- Match preferences
- Match requests
- Matches
- Conversations
- Messages
- Nanny beta profiles
- Subscriptions
- Credits ledger
- Referrals
- Reports
- Blocks
- Admin audit logs

### Storage Services
- **Current sandbox runtime**: In-memory seeded demo data for fast interaction.
- **Production handoff**: `migrations/0001_kyddos_v1_schema.sql` provides a Cloudflare D1-compatible schema.
- **Important**: Production should bind D1 and replace demo arrays with database queries.

### Vendor Placeholders
The build includes integration-ready placeholders for:
- Email verification
- SMS/phone verification
- Identity verification
- Liveness/selfie verification
- Address/billing verification
- Sex offender registry screening
- Nanny background checks
- Nanny driving checks
- Payment processor / App Store / Play Store IAP
- Public safety/Amber Alert feed

Production must use contracted vendors and store only status, timestamp, vendor reference ID, and admin-review flags whenever possible.

## Privacy and Safety Rules Implemented
- Children/Kydos are profile objects managed by parents, not direct users.
- Public child profiles use avatars only.
- No real child photos are displayed or requested for public Kydo profiles.
- No child geolocation.
- No school visibility.
- No child-facing chat, voice, or video.
- No virtual playground, livestreams, watch parties, marketplace, tutor module, WeSit module, or organization pages.
- No SSN field in normal app UI.
- Time Out Box answers are private and never shown publicly.
- Admins cannot casually read all messages; reported/safety-flagged conversations only.

## User Guide
1. Open the app at `/`.
2. Use the mobile frame bottom navigation: Discover, Requests, Matches, Messages, Menu.
3. Start in Discover to view verified family cards.
4. Use View Details to inspect avatar-only Kydo details, public fit details, and privacy limitations.
5. Use Request Playdate to send a safe first-meet request.
6. Use Requests to accept the seeded incoming request and create a match.
7. Use Messages after a mutual match.
8. Use Menu for onboarding screens, Travel Mode, Nanny Beta, Safety Feed, Subscriptions/Credits, Safety Center, Settings, Admin, and Data Model.
9. Use Admin to review operational queues and verification/moderation states.

## Mocked vs. Production-Required
### Implemented/Mocked in Sandbox
- UI screens and navigation
- Seeded user/profile/nanny/request data
- Matching logic and score breakdowns
- Subscription/credit gates
- Vendor verification statuses
- Admin dashboard queues
- Public safety feed status
- Referral metrics
- Reporting/blocking/audit APIs

### Requires Real Vendor Credentials Before Production
- Real auth and password hashing/session management
- Email/SMS delivery
- Identity/liveness/address verification
- Sex offender registry screening
- Nanny background/driving/reference checks
- App Store / Play Store in-app purchase integration
- Official public safety alert feed
- Real D1 database binding and persistence
- Production admin authorization and role enforcement
- Native iOS/Android shells or React Native/Flutter/native clients if shipping to app stores

## Features Not Yet Implemented
- Native iOS/Android binary packaging.
- Real payment processing/IAP flows.
- Real third-party verification vendors.
- Real persistent Cloudflare D1 integration at runtime.
- Push notifications.
- Production authentication/session security.
- Real location/radius calculation from privacy-safe general area data.

## Recommended Next Steps
1. Bind Cloudflare D1 and replace in-memory arrays with database operations.
2. Add production-grade authentication, password hashing, sessions, and CSRF protections as appropriate.
3. Choose verification vendors and wire callback webhooks into `verification_statuses`.
4. Implement App Store / Play Store IAP products for Premium, Super Premium, and credits.
5. Convert the validated web UX into native mobile screens or wrap with the chosen mobile framework.
6. Add automated tests for matching, gating, reports, blocks, and admin audit events.
7. Conduct privacy/security review before app store submission.

## Deployment
- **Platform**: Cloudflare Pages-compatible Hono app.
- **Local status**: Active via Wrangler Pages dev on port 3000.
- **Tech stack**: Hono + TypeScript + Cloudflare Pages + plain JavaScript SPA + CSS.
- **Build command**: `npm run build`
- **Start command**: `pm2 start ecosystem.config.cjs`
- **Last Updated**: 2026-05-03
