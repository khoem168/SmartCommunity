# Smart Community Backend

Quick steps to connect the backend to the provided `final_pro.sql` database dump.

1. Install dependencies

```bash
cd backend
npm install
```

2. Create a MariaDB / MySQL database named `final_pro` and import the SQL dump (from project root):

```bash
# create database (mysql client)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS final_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
# import dump
mysql -u root -p final_pro < ../final_pro.sql
```

3. Copy `.env.example` to `.env` and update DB credentials.

4. Run the migration and DB check scripts to verify connection:

```bash
npm run migrate-db
npm run check-db
```

5. Start the server:

```bash
npm run start
# or for development
npm run dev
```

6. Add polished final-project demo content (safe to run more than once):

```bash
npm run seed:demo
```

This creates sample forum conversations and upcoming Jitsi learning sessions so
the public pages are presentation-ready. Existing records are kept and matching
demo records are refreshed instead of duplicated.

API endpoints:

- `POST /api/auth/register` - register and issue an email-verification link
- `POST /api/auth/verify-email` - consume an email-verification token
- `POST /api/auth/resend-verification` - request a new verification link
- `POST /api/auth/login` - email/password login with optional remember-me
- `POST /api/auth/google` - verify a Google ID token and login
- `POST /api/auth/forgot-password` - request a password-reset link
- `POST /api/auth/reset-password` - consume a reset token and set a new password
- `GET /api/auth/me` - return the authenticated user

Authentication uses bcrypt password hashes and signed JWT access tokens. Existing
PBKDF2/demo accounts are upgraded to bcrypt after a successful login. When SMTP
is not configured in development, register/forgot-password responses include a
one-time development URL so the complete flow can still be tested locally.

### Production email verification

Hosted deployments can send verification and password-reset email through the
Resend HTTPS API without relying on SMTP ports. Set these environment variables
on the backend service:

```env
RESEND_API_KEY=re_your_private_api_key
EMAIL_FROM=Smart Community <verify@your-verified-domain.example>
APP_URL=https://your-frontend.example
```

`EMAIL_FROM` must be accepted by the Resend account. The Resend test sender
`Smart Community <onboarding@resend.dev>` is useful before domain verification,
but it can deliver only to the email address that owns the Resend account.
Never add `RESEND_API_KEY` to Git, Vercel, or a `VITE_*` variable. SMTP remains
available as a fallback when `RESEND_API_KEY` is empty.

Validate the HTTPS email adapter without sending a real email:

```bash
npm run test:email
```

Skill exchange endpoints (all require authentication except the public list):

- `GET /api/skill-exchanges/community` - public, sanitized community activity
- `GET /api/skill-exchanges` - list the current member's requests
- `GET /api/skill-matches` - calculate compatible members from profile skills
- `POST /api/skill-exchanges` - send a direct skill request
- `PATCH /api/skill-exchanges/:exchangeId/status` - accept, reject, or cancel
- `GET /api/skill-exchanges/:exchangeId` - participant detail and progress log
- `PATCH /api/skill-exchanges/:exchangeId/progress` - record shared progress
- `POST /api/skill-exchanges/:exchangeId/complete` - confirm one participant's completion
- `GET /api/skill-exchanges/history` - active exchanges, completed history, and statistics

Mentorship endpoints:

- `GET /api/mentors` - public verified mentor search (`q` and `skill` filters)
- `GET /api/mentors/:mentorId` - public mentor profile and verified reviews
- `POST /api/mentor-applications` - apply to become a mentor
- `GET /api/mentor-applications/me` - current application status
- `GET /api/mentor-applications` - administrator application queue
- `PATCH /api/mentor-applications/:applicationId` - administrator approval/rejection
- `GET /api/mentorships` - current user's bookings
- `POST /api/mentorships` - request an appointment
- `PATCH /api/mentorships/:mentorshipId/status` - approve, reject, cancel, or complete
- `POST /api/mentorships/:mentorshipId/reviews` - review a completed mentorship

Internship endpoints:

- `GET /api/internships` - public internship search and filters
- `GET/PATCH /api/company-profile/me` - recruiter company profile
- `POST /api/company-profile/logo` - company logo upload
- `POST /api/internships` - recruiter internship posting
- `GET /api/internships/manage` - recruiter's postings and applicant counts
- `PATCH /api/internships/:internshipId/status` - open, close, or fill a posting
- `POST /api/internships/:internshipId/apply` - student multipart PDF CV application
- `GET /api/internship-applications` - role-aware application tracking
- `PATCH /api/internship-applications/:applicationId/status` - recruiter candidate review

Career development endpoints:

- `GET /api/career/paths` - public career roadmaps
- `GET /api/career/paths/:pathId` - roadmap steps and resources
- `GET /api/career/articles` - public advice articles and category filtering
- `GET /api/career/articles/:slug` - full career article
- `GET /api/career/assessments` - available self-assessments
- `GET /api/career/assessments/:assessmentId` - assessment questions
- `GET /api/career/overview` - personalized roadmap, matches, and result history
- `POST /api/career/roadmaps` - select the current roadmap
- `PATCH /api/career/roadmaps/:roadmapId/steps/:stepId` - update progress
- `POST /api/career/assessments/:assessmentId/submit` - score and save answers

Community forum endpoints:

- `GET /api/forum/categories` - public categories and post counts
- `GET /api/forum/posts` - public search, category/type filters, and sorting
- `GET /api/forum/posts/:postId` - post, answers, comments, likes, and permissions
- `POST /api/forum/posts` - create a question or discussion
- `PATCH/DELETE /api/forum/posts/:postId` - update or remove an owned post
- `POST /api/forum/posts/:postId/answers` - publish a response
- `POST /api/forum/posts/:postId/comments` - add a short comment
- `POST /api/forum/posts/:postId/like` - toggle a post like
- `POST /api/forum/answers/:answerId/like` - toggle an answer like
- `POST /api/forum/answers/:answerId/accept` - accept an answer as the post author
- `DELETE /api/forum/answers/:answerId` - remove an owned answer
- `DELETE /api/forum/comments/:commentId` - remove an owned comment

Real-time chat endpoints (all require authentication):

- `GET /api/messages/conversations` - private/group inbox with unread counts
- `POST /api/messages/conversations` - create or reopen a private conversation
- `POST /api/messages/conversations/groups` - create a community group
- `GET /api/messages/conversations/:conversationId` - read up to 300 messages
- `POST /api/messages/conversations/:conversationId/messages` - send multipart text/file message
- `GET /api/messages/conversations/:conversationId/members` - list group members
- `POST /api/messages/conversations/:conversationId/members` - owner/admin adds members
- `DELETE /api/messages/conversations/:conversationId/members/:userId` - remove a member or leave

Socket.io connections send the JWT as `handshake.auth.token`. Authenticated
clients join only their own user room and conversation memberships. Supported
events are `message:new`, `message:read`, `notification:new`, and `typing`.
Run `npm run test:chat` with the API running to verify direct messages, groups,
file sharing, unread tracking, and message notifications.

Online learning session endpoints:

- `GET /api/learning-sessions` - public session search with `scope`, `q`, and `category`
- `GET /api/learning-sessions/:sessionId` - session detail and current-user registration
- `POST /api/learning-sessions` - mentor/admin schedules a Jitsi session
- `POST /api/learning-sessions/:sessionId/register` - register for an open session
- `DELETE /api/learning-sessions/:sessionId/register` - cancel registration
- `PATCH /api/learning-sessions/:sessionId/status` - host starts, completes, or cancels
- `POST /api/learning-sessions/:sessionId/attendance/join` - enter Jitsi and record attendance
- `POST /api/learning-sessions/:sessionId/attendance/leave` - save leave time and minutes
- `GET /api/learning-sessions/:sessionId/participants` - host attendance report
- `POST /api/learning-sessions/:sessionId/feedback` - attended participant rating/review

Meeting rooms open 30 minutes before the scheduled time and use a unique Jitsi
URL generated by the API. Run `npm run test:sessions` with the API running to
verify scheduling, registration, meeting access, attendance, completion,
feedback, and notifications.

Notification endpoints:

- `GET /api/notifications` - filterable, paginated alerts and unread statistics
- `PATCH /api/notifications/:notificationId/read` - mark one alert read
- `PATCH /api/notifications/read-all` - mark all or one category read
- `DELETE /api/notifications/:notificationId` - delete one alert
- `DELETE /api/notifications/read` - clear read alerts
- `GET/PATCH /api/notification-preferences` - category and push preferences
- `POST /api/notification-push-token` - register a Firebase web token
- `DELETE /api/notification-push-token` - disable one or all browser tokens

In-app events use authenticated Socket.io user rooms immediately. Optional
Firebase Cloud Messaging requires `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` from a Firebase service
account in `backend/.env`. Write multiline private keys with escaped `\n`
characters. The frontend also needs its Firebase web-app values and VAPID key
listed in `frontend_user/.env.example`. Run `npm run test:notifications` to
verify preferences, delivery, filtering, unread statistics, read/delete
actions, and push-token registration without requiring live Firebase secrets.

Analytics endpoint:

- `GET /api/admin/analytics?range=30d` - administrator-only platform reporting

Supported ranges are `7d`, `30d`, `90d`, and `12m`. The response contains
summary metrics, verification/application/exchange/attendance rates, growth
series, user-role and status distributions, popular profile skills, top
internships, mentor performance, and recent platform activity. Invalid ranges
fall back to `30d`. Run `npm run test:analytics` to verify role protection and
every reporting range against MariaDB.

Administration endpoints (administrator role required):

- `GET /api/admin/dashboard` - moderation summary and recent audit activity
- `GET/PATCH /api/admin/users/:userId` - search and manage user accounts
- `GET/PATCH /api/admin/mentor-applications/:applicationId` - review mentors
- `GET/PATCH /api/admin/companies/:companyId` - verify company profiles
- `GET/PATCH /api/admin/internships/:internshipId` - moderate postings
- `GET /api/admin/audit-logs` - paginated administrative audit history
- `GET /api/admin/reports/:report.csv` - download users, mentors, internships,
  applications, companies, or audit reports

The React administration workspace is available at `/admin`; platform charts
remain at `/analytics`. Account suspension takes effect on the next protected
request, administrator self-suspension and self-demotion are blocked, affected
users receive notifications, and every successful management action is logged.
Run `npm run test:admin` with the API running to validate authorization, user
management, approvals, moderation, CSV export, and the audit trail.

Course learning and Bakong KHQR endpoints:

- `GET /api/courses` - public catalog with current-user enrollment state
- `GET /api/courses/:courseSlug` - course outline and locked lesson metadata
- `GET /api/courses/:courseSlug/lessons/:lessonId` - protected video/PDF content
- `POST /api/courses/:courseId/payments/khqr` - authenticated KHQR generation
- `POST /api/course-payments/:paymentId/verify` - authenticated Bakong verification

The first lesson of every published course is a public preview. Premium lesson
URLs are returned only after a confirmed enrollment. Course price and currency
always come from MariaDB, never from the browser request. Configure the
`BAKONG_*` values in `backend/.env`; local development can reuse the existing
`bakong-main/bakong-main/backend/.env` file when those values are absent.

Run the migration to create/seed the course tables, then validate the complete
access and payment-generation flow:

```bash
npm run migrate-db
npm run test:courses
```

- `GET /health` — basic health check
- `GET /db-check` — returns number of users in `users` table
