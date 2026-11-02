# Section 02 — System Architecture, Tech Stack & Database Design

Presentation-ready content for the **Smart Community Skill & Career Development Platform**.

## Verified project scope

The following presentation content is based on features that exist in the codebase:

- Frontend: React 19, Vite, React Router 7, Vanilla CSS design system, Lucide/Feather/React Icons, Recharts.
- Backend: Node.js (v22+), Express REST API, Socket.IO real-time engine.
- Database: MySQL / MariaDB (`final_pro`) managed via `mysql2/promise` with relational integrity.
- Third-Party Services: Bakong KHQR (national payment standard), Jitsi Meet (video conferencing), Cloudinary/local uploads.
- Security: JWT stateless tokens, bcrypt password hashing, input sanitization, object-level authorization, rate limiting.

---

## Slide 05 — High-Level Full-Stack Architecture

### Multi-Tier Distributed Platform Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER (React 19 + Vite)                 │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │ frontend_user (Port 5173)│  │ frontend_admin (3000) │  │ Mobile PWA  │ │
│  │ (Student, Mentor, Recr.) │  │ (Moderation & Audit)   │  │ TabBar View │ │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────┬──────┘ │
└──────────────┼──────────────────────────┼─────────────────────┼────────┘
               │ HTTPS / REST (JSON)      │                     │ Socket.IO
               ▼                          ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API & APPLICATION TIER (Express)                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Auth & Role Guard (verifyToken, requireRole, checkOwnership)    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│  ┌─────────────────┬────────────────┼────────────────┬──────────────┐  │
│  │ Courses/KHQR    │ Mentorship     │ Skill Exchange │ Recruiter ATS│  │
│  │ Controllers     │ Controllers    │ Matching Engine│ Pipeline     │  │
│  └─────────────────┴────────────────┼────────────────┴──────────────┘  │
│  ┌──────────────────────────────────┴───────────────────────────────┐  │
│  │  Socket.IO Real-Time Engine (Direct, Swaps, Jobs & Notifications)│  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ Connection Pool (mysql2/promise)
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     DATA & INTEGRATION TIER                            │
│  ┌───────────────────────────┐         ┌────────────────────────────┐  │
│  │ MySQL Database (final_pro)│         │ External Cloud Integrations│  │
│  │ 24+ Relational Tables     │         │ • Bakong KHQR Payment API  │  │
│  │ Foreign Keys & Indices    │         │ • Jitsi Meet WebRTC Rooms  │  │
│  └───────────────────────────┘         └────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Architecture Pillars:
1. **Decoupled Client & Server:** Fast Vite client bundle communicating via clean REST endpoints and real-time WebSockets.
2. **Strict Security Barrier:** Server-side token verification and object-level permission enforcement before database access.
3. **Stateless Scalability:** JWT-based user context eliminates server session bottleneck, ready for cloud deployment (Vercel + Render + Aiven).

### Speaker notes — Khmer

> ស្លាយនេះបង្ហាញពីស្ថាបត្យកម្ម Full-Stack របស់ប្រព័ន្ធ។ យើងបែងចែកជា ៣ ជាន់ច្បាស់លាស់៖
> ជាន់ទីមួយ (Client Tier) គឺ Frontend បង្កើតដោយ React 19 និង Vite ដែលមានទំហំស្រាល ល្បឿនលឿន និងដំណើរការរលូនទាំងលើកុំព្យូទ័រ និងទូរស័ព្ទ។
> ជាន់ទីពីរ (Application Tier) គឺ Node.js និង Express REST API រួមជាមួយ Socket.IO សម្រាប់ Real-Time Messaging។ ផ្នែកនេះមានប្រព័ន្ធការពារ Auth & Role Guard យ៉ាងតឹងរ៉ឹង។
> និងជាន់ទីបី (Data & Integration Tier) គឺទិន្នន័យ MySQL `final_pro` ដែលភ្ជាប់តាម connection pool និងសេវាខាងក្រៅដូចជា Bakong KHQR និង Jitsi Meet។

**Suggested speaking time:** 60–75 seconds

---

## Slide 06 — Database Schema & Relational Integrity

### Relational Database Design (`final_pro`)

```
 [users] 1──* [courses_enrolled] *──1 [courses] 1──* [course_modules]
    │                                    │
    ├──1──* [skill_exchanges]            └──1──* [course_payments (KHQR)]
    ├──1──* [mentorship_bookings]
    ├──1──* [internship_applications] *──1 [internships] 1──* [companies]
    └──1──* [messages] *──1 [conversations]
```

#### Core Data Entities:
- **`users` & `user_skills`:** Stores profiles, hashed credentials, bio, roles (`student`, `mentor`, `recruiter`, `admin`), and teach/learn skill tags.
- **`courses` & `course_payments`:** Tracks curriculum slugs, prices, video links, KHQR MD5 hashes, and verified student enrollments.
- **`skill_exchanges` & `skill_exchange_logs`:** Manages dual-sided swap states (`pending` → `accepted` → `completed`), meeting links, and audit history.
- **`internships` & `internship_applications`:** Handles job listings, company profiles, resume URLs, applicant tracking status, and interview schedules.
- **`conversations` & `messages`:** Persists private 1:1 chats, skill swap threads, job candidate chats, and delivery read receipts.

### Speaker notes — Khmer

> ចំពោះមូលដ្ឋានទិន្នន័យ យើងជ្រើសរើសយក Relational Database MySQL 8.4 ដោយសារតែទិន្នន័យក្នុងប្រព័ន្ធរបស់យើងមានទំនាក់ទំនងជិតស្និទ្ធ (High Relational Integrity)។
> ឧទាហរណ៍ តារាង `users` ត្រូវបានភ្ជាប់ទៅកាន់ការចុះឈ្មោះរៀន `courses_enrolled` ការប្តូរជំនាញ `skill_exchanges` ការកក់ម៉ោង Mentor និងការដាក់ពាក្យធ្វើការងារ `internship_applications`។
> ការប្រើ MySQL អនុញ្ញាតឱ្យយើងប្រើ Foreign Keys និង Transactions ដើម្បីធានាថា មិនមានទិន្នន័យស្ទួន ឬទិន្នន័យបាត់បង់ (Data Consistency) ជាពិសេសលើប្រតិបត្តិការទូទាត់ប្រាក់ និងការទទួលស្គាល់ការដោះដូរជំនាញ។

**Suggested speaking time:** 60–75 seconds

---

## Slide 07 — Security, Authentication & Role Authorization

### Multi-Layer Security Architecture

| Security Layer | Implementation in Codebase | Security Benefit |
|---|---|---|
| **Password Security** | `bcrypt.hash(password, 10)` | Zero plain-text credentials stored; resistant to rainbow-table attacks. |
| **Session Control** | Stateless `jsonwebtoken` with 24h expiration | Secure API authorization via Bearer headers; no server session memory leak. |
| **Role-Based Access** | `requireRole('recruiter')`, `requireRole('admin')` | Prevents students from publishing jobs or modifying admin configurations. |
| **Object-Level Guard** | `req.user.id === resource.owner_id` | Recruiter A cannot inspect or edit Recruiter B's candidates; students cannot alter other swaps. |
| **Anti-Tampering** | Server-side pricing & KHQR MD5 verification | Client cannot manipulate course prices or spoof completed payments. |
| **Data Sanitization** | Field stripping in responses | Internal recruiter notes and sensitive email tokens are scrubbed from student JSON responses. |

### Speaker notes — Khmer

> សុវត្ថិភាពទិន្នន័យ គឺជាអាទិភាពចម្បងដែលយើងបានធ្វើតេស្តជាប់ 100% (10/10 automated tests)៖
> ទីមួយ Password ត្រូវបាន Hash ដោយប្រើ `bcrypt`។
> ទីពីរ យើងប្រើ JWT Token ជាមួយ Role-Based Access Control (RBAC)។ សិស្សមិនអាចបន្លំខ្លួនទៅបង្ហោះការងារ ឬកែទិន្នន័យ Admin បានឡើយ។
> ទីបី យើងមាន Object-Level Authorization មានន័យថាក្រុមហ៊ុន A មិនអាចលួចមើលបេក្ខជនរបស់ក្រុមហ៊ុន B បានទេ។
> និងទីបួន ការទូទាត់ប្រាក់ KHQR ត្រូវបានផ្ទៀងផ្ទាត់ដោយផ្ទាល់ពី Server-side មិនអនុញ្ញាតឱ្យ Client កែប្រែតម្លៃវគ្គសិក្សាបានជាដាច់ខាត។

**Suggested speaking time:** 60–70 seconds

---

## Recommended visual style

- Architectural diagrams rendered with sharp boxes and clean directional arrows.
- Use green checkmark badges for verified security items.
- Maintain consistent technical terminology across slides.

## Recommended section timing

| Slide | Content | Time |
|---|---|---:|
| Slide 05 | High-Level Architecture | 60–75 seconds |
| Slide 06 | Database Design & Schema | 60–75 seconds |
| Slide 07 | Security & Role Authorization | 60–70 seconds |
| **Total** | **Section 02** | **~3.5 minutes** |

## Likely teacher questions and clear answers

### 1. Why didn't you use MongoDB or Firebase for the main database?
Our system models tightly-coupled transactional workflows: course enrollment directly linked to payment verification, applicant tracking linked to company verification, and skill exchanges requiring dual-user locks. MySQL relational foreign keys and ACID transactions prevent data anomalies far better than a document database.

### 2. How do you prevent unauthorized users from accessing backend endpoints?
Every protected endpoint passes through our `verifyToken` middleware, which parses the Bearer JWT from the authorization header. Then `requireRole` or custom ownership checks verify the user's role and user ID against the targeted resource ID in the MySQL query.
