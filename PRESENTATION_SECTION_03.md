# Section 03 — Core Modules & Role-Based Workspaces

Presentation-ready content for the **Smart Community Skill & Career Development Platform**.

## Verified project scope

The following presentation content is based on features that exist in the codebase:

- Student Experience: Course learning, interactive quizzes, peer skill exchange matching, 1:1 mentor booking, internship applications.
- Mentor Experience: Public mentor profile, availability settings, booking request management, hosted live sessions.
- Recruiter Experience: Company profile, internship listing builder, candidate pipeline ATS (`pending`, `reviewed`, `shortlisted`, `approved`, `rejected`), CV viewer, interview scheduler.
- Admin Experience: User and role management, mentor review queue, company legitimacy verification, internship moderation, audit log CSV export.
- Role-Adaptive Navigation: Context-aware desktop Navbar and mobile 5-tab Bar.

---

## Slide 08 — Student Workspace & Continuous Learning Journey

### Empowering Learners from Day One

```
[ Register / Sign In ] ──► [ Student Workspace ]
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    ▼                             ▼                             ▼
[ Continue Learning ]     [ Peer Skill Swap ]          [ Career Roadmap ]
• Active Course Resume    • Compatible Peers Found     • Competency Radar
• Module Progress Bar     • Send & Accept Requests     • Course-to-Job Bridge
```

#### Core Student Features:
1. **Action-First Dashboard:** Instantly displays "Continue Learning" banner with direct resume button, pending swap requests, and application status.
2. **Interactive Classroom:** Video player, syllabus navigation, downloadable materials, and completion tracker.
3. **Smart Skill Exchange:** Direct matching between what the student knows (`teach`) and what they need to master (`learn`).
4. **Career Assessment & Radar Chart:** Recharts-powered assessment evaluating technical and soft skills, generating personalized career roadmaps.

### Speaker notes — Khmer

> នៅក្នុង Slide 08 នេះ ខ្ញុំសូមបង្ហាញពីផ្ទាំងការងាររបស់ **Student (សិស្ស/និស្សិត)**៖
> នៅពេលសិស្ស Login ចូល ពួកគាត់នឹងឃើញផ្ទាំង Workspace ដែលផ្តោតលើសកម្មភាពជាក់ស្តែង (Action-First)៖
> ទីមួយគឺផ្ទាំង **Continue Learning** ដែលអនុញ្ញាតឱ្យសិស្សចុចបន្តមេរៀនដែលកំពុងរៀនបានភ្លាមៗដោយមិនបាច់រុករកឡើងវិញ។
> ទីពីរគឺប្រព័ន្ធដោះដូរជំនាញ **Skill Swap** ដែលប្រព័ន្ធស្វែងរកដៃគូសិក្សាដែលមានជំនាញបំពេញបន្ថែមគ្នាដោយស្វ័យប្រវត្តិ។
> និងទីបីគឺ **Career Assessment** ដែលវាយតម្លៃសមត្ថភាព និងគូសជាក្រាហ្វ Radar Chart ព្រមទាំងផ្តល់នូវ Career Roadmap នាំផ្លូវទៅកាន់ការងារពិតប្រាកដ។

**Suggested speaking time:** 60–75 seconds

---

## Slide 09 — Mentor Workspace & Session Management

### Professional Guidance & Live Knowledge Transfer

#### Key Mentor Capabilities:
- **Profile & Expertise Showcase:** Display verified professional title, bio, hourly rate or free mentorship, and skill tags.
- **1:1 Booking Workflow:** Review incoming student booking requests with topic and requested time; one-click Approve or Decline.
- **Instant Video Meeting Generation:** Automatic generation of secure Jitsi Meet room links (`/sessions/:id/room`) for approved appointments.
- **Hosted Live Community Sessions:** Mentors can schedule public webinars or group workshops accessible to all enrolled community members.

#### Real-World Value:
Reduces friction for busy industry experts. Mentors manage their appointments in seconds from their dedicated workspace without manual back-and-forth messaging.

### Speaker notes — Khmer

> ចំពោះ **Mentor (អ្នកណែនាំអាជីព)**៖
> ប្រព័ន្ធបានផ្តល់ជូននូវ Workspace ផ្ទាល់ខ្លួន ដែលជួយសម្រួលដល់ការងាររបស់អ្នកជំនាញ៖
> ទីមួយ Mentor អាចកំណត់ម៉ោងទំនេរ (Availability) និងបង្ហាញពីជំនាញឯកទេសរបស់ខ្លួន។
> ទីពីរ ពេលមានសិស្សកក់ម៉ោង 1:1 Mentor អាចចុច Approve ឬ Reject បានភ្លាមៗពីផ្ទាំង Dashboard។
> ទីបី នៅពេលការកក់ត្រូវបានអនុម័ត ប្រព័ន្ធនឹងបង្កើតបន្ទប់វីដេអូ Jitsi Meet ដោយស្វ័យប្រវត្តិ ដែលអនុញ្ញាតឱ្យ Mentor និងសិស្សជួបពិភាក្សាគ្នាបានភ្លាមៗដោយមិនបាច់ប្រើ Zoom ឬ Google Meet ខាងក្រៅឡើយ។

**Suggested speaking time:** 55–65 seconds

---

## Slide 10 — Recruiter Workspace & Candidate ATS Pipeline

### Streamlined Recruitment from Job Post to Hire

```
[ Unverified Company ] ──► [ Admin Verification ] ──► [ Verified Employer ]
                                                              │
                                                              ▼
                                                     [ Post Internship ]
                                                              │
    ┌───────────────────────────┬─────────────────────────────┴───────────────────────────┐
    ▼                           ▼                             ▼                           ▼
[ 1. Pending ]          [ 2. Reviewed ]             [ 3. Shortlisted ]          [ 4. Approved / Hired ]
CV Inspection           Skill Compatibility         Schedule Interview          Direct Offer
```

#### Recruiter Toolset:
1. **Legitimacy First:** Unverified recruiters cannot publish public jobs until vetted by administrators, eliminating spam and fraudulent postings.
2. **Visual Applicant Pipeline (ATS):** Track candidates across 5 clean stages: `Pending`, `Reviewed`, `Shortlisted`, `Approved`, `Rejected`.
3. **Direct Resume & Portfolio Access:** One-click CV inspection and direct contextual chat with candidates.
4. **Interview Scheduler:** Set date, time, and meeting instructions that sync directly to the candidate's notifications and workspace.

### Speaker notes — Khmer

> ចំពោះ **Recruiter (ក្រុមហ៊ុនជ្រើសរើសបុគ្គលិក)**៖
> យើងបានបង្កើតប្រព័ន្ធ ATS (Applicant Tracking System) ខ្នាតតូច ប៉ុន្តែមានប្រសិទ្ធភាពខ្ពស់៖
> ទីមួយ ដើម្បីការពារសុវត្ថិភាពសិស្ស ក្រុមហ៊ុនត្រូវតែឆ្លងកាត់ការផ្ទៀងផ្ទាត់ (Verification) ពី Admin សិន ទើបអាចបង្ហោះការងារបាន។
> ទីពីរ Recruiter មានផ្ទាំងគ្រប់គ្រងបេក្ខជនជាដំណាក់កាល៖ ចាប់ពីការដាក់ពាក្យ (Pending), បានពិនិត្យ CV (Reviewed), ជាប់ជម្រើស (Shortlisted), រហូតដល់ការកំណត់ថ្ងៃសម្ភាសន៍ និងការយល់ព្រមទទួល (Approved)។
> ទីបី Recruiter អាចជជែកផ្ទាល់ជាមួយបេក្ខជនតាមប្រព័ន្ធ Chat ក្នុង Platform បានយ៉ាងងាយស្រួល។

**Suggested speaking time:** 60–75 seconds

---

## Slide 11 — Admin Control Panel & Quality Moderation

### Maintaining Trust, Quality & Platform Safety

| Admin Capability | Function & Purpose | Security Enforced |
|---|---|---|
| **User & Role Management** | Inspect all registered accounts, change roles, deactivate abusive users | Admin-only route guard (`requireRole('admin')`) |
| **Mentor Review Queue** | Verify applicant credentials, certifications, and expertise before public listing | Strict audit logging of approval status |
| **Company Legitimacy Check** | Inspect business registration and contact details to verify employer status | Prevents scam postings on public job board |
| **Content Moderation** | Review reported forum discussions, comments, and internship listings | Server-side cascading deletions & status updates |
| **Audit Log & CSV Export** | Export system activity logs, payments, and platform usage metrics for reporting | Tamper-proof audit tables with timestamp indices |

### Speaker notes — Khmer

> ចំពោះ **Administrator (អ្នកគ្រប់គ្រងប្រព័ន្ធ)**៖
> Admin គឺជាឆ្អឹងខ្នងសម្រាប់រក្សាគុណភាព និងសុវត្ថិភាពនៃ Platform ទាំងមូល៖
> ទីមួយ Admin គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ និងសិទ្ធិ (Role Management)។
> ទីពីរ Admin មាន Review Queue សម្រាប់ត្រួតពិនិត្យឯកសាររបស់ Mentor មុនពេលបង្ហាញជាសាធារណៈ។
> ទីបី Admin ផ្ទៀងផ្ទាត់ភាពស្របច្បាប់របស់ក្រុមហ៊ុនមុននឹងអនុញ្ញាតឱ្យបង្ហោះការងារ។
> និងទីបួន Admin អាចទាញយកទិន្នន័យ (CSV Export) នៃប្រតិបត្តិការទូទាត់ប្រាក់ និងកំណត់ហេតុ Audit Log សម្រាប់របាយការណ៍គ្រប់គ្រង។

**Suggested speaking time:** 55–65 seconds

---

## Recommended visual style

- Show real UI screenshots or mockups of the Student Dashboard, ATS Pipeline, and Mentor schedule.
- Use pipeline progress ribbons with clear color statuses: Orange (Pending), Blue (Reviewed), Purple (Shortlisted), Green (Approved).

## Recommended section timing

| Slide | Content | Time |
|---|---|---:|
| Slide 08 | Student Workspace & Learning | 60–75 seconds |
| Slide 09 | Mentor Workspace & Bookings | 55–65 seconds |
| Slide 10 | Recruiter Workspace & ATS | 60–75 seconds |
| Slide 11 | Admin Control & Moderation | 55–65 seconds |
| **Total** | **Section 03** | **~4 minutes** |

## Likely teacher questions and clear answers

### 1. Can a student also be a mentor or recruiter?
Roles are role-separated for clarity and security. If a user wishes to mentor, they apply via their profile and an administrator reviews their credentials. The database schema stores distinct foreign-key references to prevent privilege confusion.

### 2. How does the Recruiter ATS handle applicant privacy?
When a student applies, only the recruiter who created that specific job posting can view the student's CV and internal notes. Our automated tests (PASS 10/10) verify that Recruiter B cannot access Recruiter A's applicant data.
