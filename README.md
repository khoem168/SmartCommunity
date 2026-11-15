# Smart Community Skill & Career Development Platform

A web-based platform designed to support learning, mentorship, skill exchange, real-time communication, and career development for students and communities.

Read the [full website documentation](WEBSITE_DOCUMENTATION.md) for detailed functions, user permissions, pages, payments, architecture, database information, API groups, setup, and current limitations.

Read the [complete website overview and user flows](WEBSITE_FLOWS.md) for the page map, role permissions, step-by-step feature journeys, diagrams, and current implementation limits.

## What it does

- Exchange skills and knowledge through community-driven peer support.
- Connect with mentors for guidance, sessions, and career advice.
- Communicate instantly with real-time chat and collaborative discussion.
- Participate in online learning sessions and skill workshops.
- Discover and apply for internship and job opportunities.

## Key terms

- **Smart Community**: A digital online community where users collaborate, communicate, and share knowledge using modern web technologies.
- **Skill Exchange**: A process where users teach and learn skills from each other without requiring formal courses.
- **Career Development**: Activities that help students improve professional skills, mentorship, and internship experiences.
- **Real-Time Communication**: Instant communication between users through chat and online meetings.
- **Mentorship System**: A feature that allows experienced users or mentors to guide students and support learning and career growth.

## Structure

- `backend/`: Node.js + Express backend server, database configuration, and API scaffolding.
- `frontend_user/`: User-facing React application with courses, mentorship, jobs, auth, and community pages.
- `frontend_admin/`: Admin-facing frontend (not updated here).
- `final_pro.sql`: MySQL/MariaDB database schema and seed data.

## Frontend user setup

```bash
cd frontend_user
npm install
npm run dev
```

## Vercel deployment

Deploy this repository as one Vercel Services project with the repository root
selected. The root configuration builds the backend, both Vite frontends, and
the internal Telegram service independently behind one domain.

The main website uses /, the separate admin app uses /admin-console/, and the
backend receives /api, /socket.io, /uploads, and /health traffic. Telegram stays
internal and unused. Browser API calls default to /api; there are no runtime
bindings because no server-side service currently calls another service.

See [the Vercel deployment guide](VERCEL_DEPLOYMENT.md) for the confirmed routing,
required environment variables, database and storage setup, local testing, and
runtime limits. This replaces the earlier frontend-only import instructions.

### Production safety checklist

Before starting the public backend, copy `backend/.env.example` to the hosting
provider's private environment settings and replace every example value. In
production the server intentionally refuses to start unless all of these are
safe:

- `NODE_ENV=production` (Vercel sets this at runtime by itself; do not add it
  there, or the frontend builds lose their devDependencies)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` use hosted database values
- `JWT_SECRET` is a unique random secret with at least 32 characters
- `CLIENT_URL` lists the exact HTTPS frontend origin (never `*`)
- `APP_URL` is the public HTTPS frontend URL

The `/db-check` diagnostic endpoint and placeholder demo passwords are disabled
in production. Do not publish `backend/.env`; environment files are excluded by
the repository `.gitignore`.

## Backend setup

```bash
docker compose up -d database
cd backend
npm install
npm run migrate-db
npm run check-db
npm run start
```

The Docker database is bound to `127.0.0.1:3306`. On its first start it
creates the `final_pro` database and imports `final_pro.sql` automatically.
Database files are retained in the `smart-community-db-data` Docker volume.

To stop the database without deleting its data:

```bash
docker compose stop database
```

## Authentication

Run `npm run migrate-db` after pulling authentication changes. The user frontend
supports registration, email verification, login, remember-me, forgot/reset
password, and Google Login. Without SMTP credentials, local development shows
one-time verification/reset links in the browser. To enable Google Login, set the
same OAuth web client ID as `GOOGLE_CLIENT_ID` in `backend/.env` and as
`VITE_GOOGLE_CLIENT_ID` in `frontend_user/.env`.

## User profiles

Authenticated users can manage their bio, career goal, skills, social links,
education, experience, certificates, and portfolio projects at `/profile`.
Profile/project images use Cloudinary when its three credentials are configured
in `backend/.env`; otherwise they are stored under `backend/uploads` for local
development. Run `npm run migrate-db` after pulling profile schema changes.

## Skill exchange

Authenticated members can add the skills they teach and want to learn on
`/profile`, then open `/community` to see server-calculated skill matches. A
member can send a direct exchange request, while the receiving member can accept
it with a meeting date or decline it with a reason.

Accepted exchanges include a private chat, a Jitsi meeting link, shared progress
updates, completion confirmation from both participants, and a permanent
learning history. Manage requests at `/skill-requests` and open an accepted
exchange to record progress. Run `npm run migrate-db` after pulling the skill
exchange schema changes.

## Mentorship

The `/mentorship` area provides a searchable directory of verified mentors,
mentor applications, administrator verification, and a personal booking board.
Students choose a topic, preferred date, duration, and meeting frequency. The
mentor can approve or decline the appointment; approval creates a private Jitsi
meeting link. After completion, the student can publish a verified rating and
review on the mentor profile.

Users who register with the Mentor role remain students until an administrator
approves their application. Existing verified mentors remain available. Run
`npm run migrate-db` after pulling mentorship schema changes.

## Internships

Recruiters create a company profile at `/applications`, then publish detailed
internships at `/post-job`. Students search and filter opportunities at `/jobs`,
apply online with a PDF CV, optional portfolio, and cover letter, and track each
status change at `/applications`.

Recruiters can view CVs, add private candidate notes, move applications through
pending, reviewed, shortlisted, approved, or rejected states, and close or fill
their internship postings. PDF CVs use Cloudinary when configured and otherwise
use local `backend/uploads/internship-cvs` storage. Run `npm run migrate-db`
after pulling internship schema changes.

## Career development

The `/career` dashboard contains personalized career-path recommendations,
trackable roadmap milestones, practical advice articles, and a career-readiness
self-assessment. Assessment attempts are saved to MariaDB, scored across
technical foundations, problem solving, project evidence, and career readiness,
and displayed with a Recharts radar chart.

Selecting a roadmap makes it the current plan without deleting progress from a
previous path. Users can complete or reopen individual milestones and see their
overall completion percentage update immediately. Run `npm run migrate-db`
after pulling career development schema changes.

## Community forum

The `/forum` area lets visitors browse and search questions or discussions in
Programming, Design, Career, and Internship categories. Authenticated users can
publish posts, add answers and comments, like useful content, and receive forum
notifications. Question authors can mark one response as the accepted answer
and close or reopen their post; authors and administrators can remove their
content. Run `npm run migrate-db` after pulling forum schema changes.

## Real-time chat

The `/messages` area supports JWT-protected private conversations and community
groups. Members can see unread counts, typing indicators, and live new-message
alerts through Socket.io. A message can include text, a JPG/PNG/WebP image, or a
PDF/TXT/DOC/DOCX document up to 10 MB. Local files are stored under
`backend/uploads/messages`; Cloudinary is used when its credentials are set.

Create a group with the plus button beside Conversations, select its members,
and send text or attachments from the same composer used for private chat. Run
`npm run migrate-db` after pulling chat schema changes. The backend integration
test can be rerun while the API is running:

```bash
cd backend
npm run test:chat
```

## Online learning sessions

The `/sessions` area provides mentor-led live learning with Jitsi Meet. Verified
mentors and administrators can schedule a session with a title, category,
level, date, duration, capacity, registration deadline, and optional material
links. Students can register or cancel, then enter the meeting during its join
window.

The embedded Jitsi room supports video, audio, meeting chat, and screen sharing
without a paid Zoom SDK. Participant join/leave times, attendance minutes,
status, ratings, and feedback are stored in MariaDB. Hosts can view the
attendance board, start, complete, or cancel a session, and participants receive
session notifications.

Run the migration and integration test after pulling session changes:

```bash
cd backend
npm run migrate-db
npm run test:sessions
```

## Notifications

The `/notifications` activity center receives live Socket.io alerts for new
messages, mentorship bookings, skill requests, internship postings and
applications, learning sessions, forum activity, and system updates. Users can
filter by category, show unread alerts, mark one category or everything read,
delete individual alerts, clear read alerts, and choose which categories are
enabled.

Socket.io notifications work locally without extra configuration. Firebase
Cloud Messaging is optional and adds browser notifications when the application
is in the background. Add the Firebase web application values and Web Push
certificate key to `frontend_user/.env` using `.env.example`, then add the
service-account project ID, client email, and private key to `backend/.env`.
Keep the service-account private key out of source control. The included
`firebase-messaging-sw.js` handles background notification display and clicks.

Run the notification integration test while the API is running:

```bash
cd backend
npm run test:notifications
```

## Analytics dashboard

Administrators can open `/analytics` to view database-driven reporting for
users, verified mentors, recruiters, internships, applications, skill
exchanges, live learning sessions, forum posts, and messages. Reporting ranges
include 7 days, 30 days, 90 days, and 12 months.

The dashboard uses Recharts for growth trends, role and internship
distributions, application status, popular skills, and conversion rates. It
also includes top-internship and mentor-performance tables, recent platform
activity, and a print-friendly report view. The analytics endpoint is protected
by JWT authentication and the administrator role.

Run the live analytics integration test while the API is running:

```bash
cd backend
npm run test:analytics
```
