# ឯកសារពិពណ៌នា និងសេចក្តីយោងមុខងារគម្រោងពេញលេញ (Project Master Documentation)
## Smart Community Skill & Career Development Platform
**ប្រភេទគម្រោង:** Full-Stack Web Application (ប្រព័ន្ធអេកូឡូស៊ីសិក្សា ការប្តូរជំនាញ និងការស្វែងរកការងារ)  
**ថ្នាក់សិក្សា:** ថ្នាក់សរសេរកូដ ដោយប្រើ AI  
**កាលបរិច្ឆេទធ្វើបច្ចុប្បន្នភាព:** ខែវិច្ឆិកា ឆ្នាំ ២០២៦  
**មូលដ្ឋានទិន្នន័យ:** MySQL 8.4 (`final_pro`)  
**ស្ថានភាពប្រព័ន្ធ:** ដំណើរការពេញលេញ (100% Tested & Verified)

---

## មាតិកា (Table of Contents)

1. [សេចក្តីផ្តើម និងចក្ខុវិស័យនៃគម្រោង](#១-សេចក្តីផ្តើម-និងចក្ខុវិស័យនៃគម្រោង)
2. [ស្ថាបត្យកម្មប្រព័ន្ធ និងបច្ចេកវិទ្យាដែលបានប្រើ](#២-ស្ថាបត្យកម្មប្រព័ន្ធ-និងបច្ចេកវិទ្យាដែលបានប្រើ)
3. [ការបែងចែកសិទ្ធិ និងតួនាទីអ្នកប្រើប្រាស់ (User Roles & Permissions)](#៣-ការបែងចែកសិទ្ធិ-និងតួនាទីអ្នកប្រើប្រាស់)
4. [ការពិពណ៌នាមុខងារលម្អិតនៃម៉ូឌុលទាំង ១២ (Detailed 12 Modules)](#៤-ការពិពណ៌នាមុខងារលម្អិតនៃម៉ូឌុលទាំង-១២)
5. [រចនាសម្ព័ន្ធមូលដ្ឋានទិន្នន័យ MySQL (`final_pro`)](#៥-រចនាសម្ព័ន្ធមូលដ្ឋានទិន្នន័យ-mysql)
6. [បញ្ជី API Endpoints សំខាន់ៗ (API Reference)](#៦-បញ្ជី-api-endpoints-សំខាន់ៗ)
7. [ប្រព័ន្ធសុវត្ថិភាព និងលទ្ធផលធ្វើតេស្តស្វ័យប្រវត្តិ (Security & Test Verification)](#៧-ប្រព័ន្ធសុវត្ថិភាព-និងលទ្ធផលធ្វើតេស្តស្វ័យប្រវត្តិ)
8. [ការណែនាំអំពីការដំណើរការគម្រោងលើម៉ាស៊ីន (Local Setup & Run Guide)](#៨-ការណែនាំអំពីការដំណើរការគម្រោងលើម៉ាស៊ីន)

---

## ១. សេចក្តីផ្តើម និងចក្ខុវិស័យនៃគម្រោង

**Smart Community Skill & Career Development Platform** គឺជាប្រព័ន្ធវេទិកាឌីជីថលបែបបណ្តាញសហគមន៍ឆ្លាតវៃ ដែលបង្កើតឡើងដើម្បីដោះស្រាយបញ្ហាស្នូលធំៗចំនួន ៤ នៅក្នុងវិស័យអប់រំ និងទីផ្សារការងារយុវជននៅកម្ពុជា៖
1. **កង្វះប្រព័ន្ធសិក្សា និងការងាររួមគ្នា:** សិស្សរៀនតាមវេទិកាមួយ ស្វែងរកការងារតាមបណ្តាញសង្គម និងស្វែងរកអ្នកណែនាំនៅកន្លែងផ្សេង ធ្វើឱ្យទិន្នន័យនៅរាយប៉ាយ។ Platform នេះប្រមូលផ្តុំធនធានទាំងអស់មកកន្លែងតែមួយ។
2. **ការរៀនសូត្រតាមរយៈការចែករំលែក (Peer-to-Peer Learning):** មិនមែនសិស្សគ្រប់រូបសុទ្ធតែមានលទ្ធភាពបង់ថ្លៃសិក្សាខ្ពស់នោះទេ។ ប្រព័ន្ធផ្តល់នូវមុខងារ **Skill Exchange** ដែលអនុញ្ញាតឱ្យសិស្សដែលមានជំនាញខុសគ្នា ដោះដូរចំណេះដឹងគ្នាដោយឥតគិតថ្លៃ។
3. **ការភ្ជាប់ទំនាក់ទំនងជាមួយអ្នកជំនាញ (Verified Mentorship):** បង្កើតឱកាសឱ្យយុវជនទទួលបានការណែនាំ 1:1 ពីអ្នកជំនាញក្នុងឧស្សាហកម្មពិតប្រាកដ រួមទាំងការរៀបចំថ្នាក់រៀនផ្ទាល់ (Live Sessions)។
4. **ការបំពេញគម្លាតជំនាញ (Smart Career Bridge):** ប្រព័ន្ធមិនត្រឹមតែបង្ហាញការងារប៉ុណ្ណោះទេ ប៉ុន្តែវិភាគប្រៀបធៀបជំនាញសិស្សជាមួយលក្ខខណ្ឌការងារ រួចបង្ហាញ Course ដែលត្រូវរៀនបំពេញបន្ថែមដើម្បីទទួលបានការងារនោះ។

---

## ២. ស្ថាបត្យកម្មប្រព័ន្ធ និងបច្ចេកវិទ្យាដែលបានប្រើ

ប្រព័ន្ធត្រូវបានបង្កើតឡើងតាមទម្រង់ **Multi-Tier Distributed Architecture** ដែលមានភាពរលូន និងមានសុវត្ថិភាពខ្ពស់៖

```
[ Frontend: React 19 + Vite ] ──(HTTPS/REST & WebSocket)──► [ Backend: Node.js + Express API ]
                                                                     │
                                               ┌─────────────────────┼─────────────────────┐
                                               ▼                     ▼                     ▼
                                    [ MySQL: final_pro ]    [ Bakong KHQR API ]    [ Jitsi Meet WebRTC ]
```

### បច្ចេកវិទ្យាសំខាន់ៗ (Tech Stack):
- **Frontend User Application (`frontend_user`):**
  - **Framework:** React 19, Vite, React Router 7.
  - **Styling:** Vanilla CSS Design System (Liquid Glass, Modern Dark/Light Theme, Responsive Layout).
  - **Data Visualization:** Recharts (សម្រាប់ Radar Chart វាស់សមត្ថភាព និងក្រាហ្វស្ថិតិ)។
  - **Icons:** React Icons (Feather, Ionicons, Lucide)។
  - **Port:** `5173`
- **Frontend Admin Application (`frontend_admin`):**
  - **Framework:** React + Ant Design (AntD) សម្រាប់ផ្ទាំងគ្រប់គ្រងទិន្នន័យកម្រិតរដ្ឋបាល។
  - **Port:** `3000`
- **Backend REST API (`backend`):**
  - **Runtime:** Node.js (v22+), Express.js framework.
  - **Real-Time:** Socket.IO សម្រាប់ប្រព័ន្ធផ្ញើសារ និងការជូនដំណឹងភ្លាមៗ (Instant Messaging & Push Notifications)។
  - **Security:** `jsonwebtoken` (JWT), `bcrypt` (Password hashing), CORS, Rate Limiting, Input Sanitization.
  - **Port:** `4000`
- **Database (`MySQL` / `MariaDB`):**
  - Database Name: `final_pro` (ដំណើរការលើ MySQL 8.4 តាមរយៈ connection pool នៃ `mysql2/promise`)។
  - Port: `3306`
- **សេវាខាងក្រៅ (Third-Party Integrations):**
  - **Bakong KHQR:** ស្តង់ដារទូទាត់ប្រាក់ជាតិនៃប្រទេសកម្ពុជា សម្រាប់ដោះសោវគ្គសិក្សា Premium ស្វ័យប្រវត្តិ។
  - **Jitsi Meet:** ប្រព័ន្ធប្រជុំវីដេអូ WebRTC ផ្ទាល់ក្នុង browser សម្រាប់ថ្នាក់រៀនផ្ទាល់ និងការណែនាំ 1:1។

---

## ៣. ការបែងចែកសិទ្ធិ និងតួនាទីអ្នកប្រើប្រាស់ (User Roles & Permissions)

ប្រព័ន្ធអនុវត្តនូវគោលការណ៍ **Role-Based Access Control (RBAC)** យ៉ាងតឹងរ៉ឹង៖

| តួនាទី (Role) | ផ្ទាំងការងារ (Workspace) | សិទ្ធិ និងសមត្ថភាពក្នុងប្រព័ន្ធ |
|---|---|---|
| **Student** (សិស្ស/និស្សិត) | `/dashboard` (Student Mode) | • ចូលរៀនវគ្គសិក្សា និងបង់ប្រាក់តាម Bakong KHQR<br>• ស្វែងរកដៃគូ និងស្នើសុំដោះដូរជំនាញ (Skill Swap)<br>• កក់ម៉ោងជាមួយ Mentor និងចូលរៀនថ្នាក់ Live<br>• ធ្វើតេស្ត Career Assessment និងតាមដាន Roadmap<br>• ដាក់ពាក្យស្នើសុំធ្វើកម្មសិក្សា (Internship) និងជជែកផ្ទាល់ជាមួយក្រុមហ៊ុន |
| **Mentor** (អ្នកណែនាំ) | `/dashboard` (Mentor Mode) | • បង្ហាញប្រវត្តិរូប និងជំនាញឯកទេសជាសាធារណៈ<br>• កំណត់ម៉ោងទំនេរ (Availability) និងតម្លៃសេវា/មិនគិតថ្លៃ<br>• ទទួល និងអនុម័តការកក់ម៉ោង 1:1 ពីសិស្ស (Approve/Decline)<br>• បង្កើត និងដឹកនាំថ្នាក់រៀនបន្តផ្ទាល់តាម Jitsi Meet |
| **Recruiter** (ក្រុមហ៊ុនជ្រើសរើសបុគ្គលិក) | `/dashboard` (Recruiter Mode) | • បង្កើត និងគ្រប់គ្រងទម្រង់ក្រុមហ៊ុន (Company Profile)<br>• ប្រកាសឱកាសការងារ/កម្មសិក្សា (ក្រោយ Admin ផ្ទៀងផ្ទាត់)<br>• គ្រប់គ្រងបេក្ខជនតាមប្រព័ន្ធ ATS (Pending → Reviewed → Shortlisted → Approved)<br>• ពិនិត្យ CV បេក្ខជន និងកំណត់កាលវិភាគសម្ភាសន៍ការងារ |
| **Admin** (អ្នកគ្រប់គ្រងប្រព័ន្ធ) | `/admin` & `/frontend_admin` | • គ្រប់គ្រងគណនី និងផ្លាស់ប្តូរសិទ្ធិអ្នកប្រើប្រាស់<br>• ពិនិត្យ និងអនុម័តពាក្យស្នើសុំធ្វើជា Mentor (Review Queue)<br>• ផ្ទៀងផ្ទាត់ភាពស្របច្បាប់របស់ក្រុមហ៊ុនមុនអនុញ្ញាតឱ្យបង្ហោះការងារ<br>• ត្រួតពិនិត្យ និងលុបមាតិកាមិនសមរម្យក្នុង Forum និងការងារ<br>• ទាញយកទិន្នន័យរបាយការណ៍ Audit Logs ជាឯកសារ CSV |

---

## ៤. ការពិពណ៌នាមុខងារលម្អិតនៃម៉ូឌុលទាំង ១២ (Detailed 12 Modules)

### ម៉ូឌុលទី ០១៖ Authentication, Profile & Role Navigation
- **ការចុះឈ្មោះ និងចូលប្រើ:** គាំទ្រការបង្កើតគណនីដោយជ្រើសរើសតួនាទី (Student, Mentor, Recruiter), ការផ្ទៀងផ្ទាត់អ៊ីមែល, ការប្តូរពាក្យសម្ងាត់ (Forgot/Reset Password) និងការរក្សាទុក Password ដោយប្រើ `bcrypt`។
- **ការគ្រប់គ្រង Profile:** កំណត់ព័ត៌មានផ្ទាល់ខ្លួន, Bio, ជំនាញដែលចេះ (`teach`), ជំនាញដែលចង់រៀន (`learn`), ទីតាំង, គោលដៅអាជីព និងរូបតំណាង Avatar។
- **Role-Based Navigation:** របារ Menu ខាងលើ (Navbar) និង TabBar លើទូរស័ព្ទ (Mobile) ផ្លាស់ប្តូរដោយស្វ័យប្រវត្តិតាម Role របស់អ្នកប្រើប្រាស់ (ឧ. Recruiter ឃើញ Candidates/Jobs, Mentor ឃើញ Sessions/Bookings, Student ឃើញ Courses/Jobs)។

### ម៉ូឌុលទី ០២៖ Role-Adaptive Workspaces (Smart Dashboard)
- **Student Workspace:** មានផ្ទាំង **Continue Learning Banner** ដែលបង្ហាញវគ្គសិក្សាកំពុងរៀន ភាគរយវឌ្ឍនភាព និងប៊ូតុងចុចបន្តមេរៀនភ្លាមៗ, បង្ហាញសំណើដោះដូរជំនាញ, ស្ថានភាពពាក្យសុំការងារ និង Next Step Recommendations។
- **Mentor Workspace:** បង្ហាញការស្នើសុំកក់ម៉ោង 1:1 ពីសិស្ស, ប៊ូតុង Approve/Decline ភ្លាមៗ, ថ្នាក់រៀន Live ដែលត្រូវបង្រៀនថ្ងៃនេះ និងស្ថានភាពអនុម័តគណនី Mentor។
- **Recruiter Workspace:** បង្ហាញផ្ទាំងបដាបញ្ជាក់ស្ថានភាពក្រុមហ៊ុន (Verified / Pending Review), បង្ហាញចំនួនការងារកំពុងបើក, ចំនួនបេក្ខជនដាក់ពាក្យ និងផ្ទាំង Hiring Pipeline Bar។
- **Admin Workspace:** បង្ហាញស្ថិតិអ្នកប្រើប្រាស់សរុប, ចំនួន Mentor និងក្រុមហ៊ុនដែលកំពុងរង់ចាំការត្រួតពិនិត្យ។

### ម៉ូឌុលទី ០៣៖ Courses Catalog & Interactive Classroom
- **កាតាឡុកវគ្គសិក្សា (`/courses`):** រុករកវគ្គសិក្សាតាមប្រភេទ (Web Development, Mobile App, Design, Data Science, Career), ការស្វែងរកតាមពាក្យគន្លឹះ និងការបែងចែករវាងវគ្គសិក្សា Free និង Premium។
- **បន្ទប់រៀន (`/courses/:slug`):** មេរៀនបែងចែកជា Modules និង Topics, ឧបករណ៍ចាក់វីដេអូ, ឯកសារអាន, ធនធានទាញយក (Downloadable Resources) និងប្រព័ន្ធកត់ត្រាវឌ្ឍនភាពការរៀន (% Progress)។

### ម៉ូឌុលទី ០៤៖ Bakong KHQR Payment & Automated Enrollment
- **ការទូទាត់ប្រាក់វគ្គសិក្សា:** នៅពេលសិស្សចុចទិញវគ្គសិក្សា Premium ប្រព័ន្ធ Server នឹងទាញយកតម្លៃពិតប្រាកដពីរចនាសម្ព័ន្ធ MySQL រួចបង្កើតកូដ KHQR ស្តង់ដារជាតិនៃធនាគារជាតិនៃកម្ពុជា។
- **ផ្ទៀងផ្ទាត់ស្វ័យប្រវត្តិ (Server-Side Verification):** សិស្ស Scan ទូទាត់តាម App ធនាគារណាក៏បាន (ABA, ACLEDA, Canadia...)។ Server នឹងផ្ទៀងផ្ទាត់លេខកូដ Hash MD5 នៃប្រតិបត្តិការ ហើយបើកសិទ្ធិចូលរៀនភ្លាមៗដោយស្វ័យប្រវត្តិ។

### ម៉ូឌុលទី ០៥៖ Peer-to-Peer Skill Exchange Matching Engine
- **ការផ្គូផ្គងឆ្លាតវៃ:** ក្បួនគណនា (Algorithm) ប្រៀបធៀបរវាងជំនាញដែលអ្នកប្រើប្រាស់ម្នាក់ចេះបង្រៀន (`teach`) និងជំនាញដែលអ្នកប្រើប្រាស់ម្នាក់ទៀតចង់រៀន (`learn`) ដើម្បីស្វែងរកដៃគូដែលបំពេញបន្ថែមគ្នាទៅវិញទៅមក។
- **វដ្តជីវិតនៃការដោះដូរ (Lifecycle):**
  1. `Pending`: ផ្ញើសំណើដោះដូរជំនាញ (ការពារមិនឱ្យផ្ញើស្ទួន និងមិនអាចផ្ញើទៅខ្លួនឯងបាន)។
  2. `Accepted`: ដៃគូម្ខាងទៀតយល់ព្រមទទួល និងកំណត់កាលបរិច្ឆេទជួប រួមទាំង Link បន្ទប់ប្រជុំ។
  3. `Progress Tracking`: អ្នកចូលរួមអាចកត់ត្រាវឌ្ឍនភាពនៃការរៀនពី 0% ដល់ 100%។
  4. `Dual Confirmation`: ការដោះដូរនឹងចាត់ទុកថា Completed លុះត្រាតែភាគីទាំងសងខាងចុច Confirm ទាំងអស់គ្នា។

### ម៉ូឌុលទី ០៦៖ Mentorship Directory & 1:1 Booking Workflow
- **បញ្ជីឈ្មោះអ្នកណែនាំ (`/mentorship`):** ស្វែងរក Mentor តាមជំនាញឯកទេស បទពិសោធន៍ការងារ និងការវាយតម្លៃ (Ratings & Reviews)។
- **ការកក់ម៉ោង:** សិស្សជ្រើសរើសប្រធានបទដែលចង់ពិភាក្សា ជ្រើសរើសកាលបរិច្ឆេទ និងម៉ោង រួចផ្ញើសំណើ។
- **ការជួបពិភាក្សា:** នៅពេល Mentor អនុម័ត ប្រព័ន្ធនឹងបង្កើតបន្ទប់ WebRTC Video Room ដោយស្វ័យប្រវត្តិ។

### ម៉ូឌុលទី ០៧៖ Live Learning Sessions & WebRTC Jitsi Hub
- **ថ្នាក់រៀនផ្ទាល់ (`/sessions`):** បង្ហាញកាលវិភាគថ្នាក់រៀនបន្តផ្ទាល់ សិក្ខាសាលា និង Webinars ដែលរៀបចំឡើងដោយ Mentor ឬគ្រូបង្រៀន។
- **បន្ទប់រៀន Jitsi Meet (`/sessions/:id/room`):** បង្កប់កម្មវិធីប្រជុំវីដេអូ WebRTC ផ្ទាល់ក្នុងគេហទំព័រ ដែលមានមុខងារ Screen Sharing, Chat, និងលើកដៃសួរ ដោយមិនចាំបាច់ដំឡើងកម្មវិធីបន្ថែម។

### ម៉ូឌុលទី ០៨៖ Career Development & Radar Chart Roadmap
- **ការវាយតម្លៃសមត្ថភាព (Career Assessment):** សំណួរស្ទង់មតិពហុជម្រើសដើម្បីវាស់ស្ទង់ជំនាញបច្ចេកទេស និងជំនាញទន់ (Soft Skills)។
- **Radar Competency Chart:** គូរជាក្រាហ្វ Radar Chart តាមរយៈបណ្ណាល័យ Recharts បង្ហាញចំណុចខ្លាំង និងចំណុចខ្វះខាតលើ ៥-៦ វិមាត្រ។
- **Roadmap អាជីព:** ផ្តល់នូវផែនទីបង្ហាញផ្លូវជាជំហានៗ (Step-by-Step Milestones) ពីកម្រិតដំបូង (Beginner) រហូតដល់កម្រិតអាចបម្រើការងារបាន (Job-Ready)។

### ម៉ូឌុលទី ០៩៖ Smart Career Bridge & Recruiter ATS
- **ការគណនាពិន្ទុត្រូវគ្នា (Skill Match Score):** ប្រព័ន្ធប្រៀបធៀបជំនាញសិស្សជាមួយ Requirements នៃការងារនីមួយៗ រួចគណនាជា % Match Score (ឧ. 100% Match ឬ 67% Match)។
- **Skill Gap Bridge:** ប្រសិនបើសិស្សខ្វះជំនាញណា ប្រព័ន្ធនឹងបង្ហាញ Course ដែលត្រូវរៀនបំពេញបន្ថែម ដើម្បីភ្ជាប់ទៅកាន់ឱកាសការងារនោះ។
- **ប្រព័ន្ធតាមដានបេក្ខជន (ATS):** ក្រុមហ៊ុនអាចផ្លាស់ប្តូរស្ថានភាពបេក្ខជនជាដំណាក់កាល (`Pending` → `Reviewed` → `Shortlisted` → `Approved` → `Rejected`), ពិនិត្យមើល CV និងកំណត់ថ្ងៃសម្ភាសន៍។

### ម៉ូឌុលទី ១០៖ Community Forum & Knowledge Discussions
- **វេទិកាពិភាក្សា (`/forum`):** សិស្ស និងសមាជិកអាចសួរសំណួរ ចែករំលែកបទពិសោធន៍ និងឆ្លើយតបគ្នា។
- **ការរៀបចំប្រភេទ:** បែងចែកជាប្រភេទដូចជា Coding, Career Advice, UI/UX, និង General Discussions រួមទាំងប្រព័ន្ធ Upvote និង Favorite។

### ម៉ូឌុលទី ១១៖ Real-Time Contextual Chat & Notifications
- **ការជជែកតាមពេលវេលាជាក់ស្តែង (Socket.IO):** ផ្ញើសារបានភ្លាមៗដោយគ្មានការពន្យារពេល។
- **Contextual Header:** នៅពេលជជែកទាក់ទងនឹងការងារ ក្បាលប្រអប់ Chat នឹងបង្ហាញឈ្មោះការងារ ស្ថានភាព និង Link CV។ នៅពេលជជែកដោះដូរជំនាញ ក្បាល Chat នឹងបង្ហាញវឌ្ឍនភាព និងប៊ូតុង Video Call។
- **Notification Center:** ជូនដំណឹងភ្លាមៗនៅពេលមានការឆ្លើយតបសារ សំណើដោះដូរជំនាញថ្មី ការអនុម័តកក់ម៉ោង ឬការកោះហៅសម្ភាសន៍ការងារ។

### ម៉ូឌុលទី ១២៖ Admin Back-Office & Quality Control
- **ការត្រួតពិនិត្យ និងអនុម័ត:** ពិនិត្យបញ្ជាក់ឯកសារសម្គាល់របស់ Mentor និងភាពស្របច្បាប់នៃអាជីវកម្មរបស់ Recruiter មុននឹងអនុញ្ញាតឱ្យបង្ហាញជាសាធារណៈ។
- **របាយការណ៍ និង Audit Logs:** កត់ត្រារាល់សកម្មភាពសំខាន់ៗក្នុងប្រព័ន្ធ (ការចុះឈ្មោះ ការបង់ប្រាក់ ការលុបមាតិកា) និងមានមុខងារ Export ជាឯកសារ CSV សម្រាប់រដ្ឋបាល។

---

## ៥. រចនាសម្ព័ន្ធមូលដ្ឋានទិន្នន័យ MySQL (`final_pro`)

មូលដ្ឋានទិន្នន័យ `final_pro` ប្រើប្រាស់ម៉ាស៊ីន InnoDB ជាមួយ Foreign Keys ដើម្បីធានានូវ ACID Transactions៖

| ឈ្មោះតារាង (Table) | គោលបំណង និងទិន្នន័យដែលរក្សាទុក |
|---|---|
| `users` | គណនីអ្នកប្រើប្រាស់, ឈ្មោះពេញ, អ៊ីមែល, password hash, role (`student`, `mentor`, `recruiter`, `admin`), avatar, bio, career goal |
| `user_skills` | ជំនាញរបស់សមាជិក (បែងចែកជា `type = 'teach'` និង `type = 'learn'`) |
| `courses` | ព័ត៌មានវគ្គសិក្សា, ចំណងជើង, slug, description, តម្លៃ, instructor_id, category, thumbnail |
| `course_modules` | មេរៀន និងប្រធានបទក្នុងវគ្គសិក្សា, video_url, duration, order_index |
| `courses_enrolled` | កំណត់ត្រាសិស្សដែលបានចុះឈ្មោះរៀន, ភាគរយវឌ្ឍនភាព (`progress`), កាលបរិច្ឆេទបញ្ចប់ |
| `course_payments` | កំណត់ត្រាទូទាត់ប្រាក់ Bakong KHQR, transaction_hash, amount, currency, status (`pending`, `completed`, `failed`) |
| `skill_exchanges` | សំណើដោះដូរជំនាញ, requester_id, provider_id, skill_requested, skill_offered, meeting_link, status |
| `skill_exchange_logs`| កំណត់ត្រាវឌ្ឍនភាពនៃការដោះដូរជំនាញ និងប្រវត្តិនៃការបញ្ជាក់បញ្ចប់ |
| `mentorship_applications`| ពាក្យស្នើសុំធ្វើជា Mentor, professional_title, experience_years, bio, status (`pending`, `approved`, `rejected`) |
| `mentorship_bookings`| ការកក់ម៉ោង 1:1, student_id, mentor_id, topic, requested_time, meeting_link, status |
| `learning_sessions` | ថ្នាក់រៀនផ្ទាល់, host_id, title, scheduled_time, duration_minutes, meeting_link, status |
| `companies` | ព័ត៌មានក្រុមហ៊ុន, recruiter_id, company_name, description, website, verification_status (`pending`, `verified`, `rejected`) |
| `internships` | ឱកាសការងារ/កម្មសិក្សា, company_id, title, requirements (JSON), location, stipend, status (`open`, `closed`) |
| `internship_applications`| ពាក្យស្នើសុំការងារ, student_id, internship_id, resume_url, status (`pending`, `reviewed`, `shortlisted`, `approved`, `rejected`), interview_date |
| `career_paths` & `roadmaps` | ផែនទីបង្ហាញផ្លូវអាជីព, target_role, required_competencies, steps |
| `forum_posts` & `replies`| ប្រធានបទពិភាក្សា និងចម្លើយឆ្លើយឆ្លងក្នុងសហគមន៍ |
| `conversations` & `messages`| បន្ទប់ជជែក, ប្រភេទ (`direct`, `job_application`, `skill_exchange`), ខ្លឹមសារសារ, read status |
| `notifications` | ការជូនដំណឹងផ្ទាល់ខ្លួន, user_id, title, message, link, is_read |
| `audit_logs` | កំណត់ត្រាសកម្មភាពសុវត្ថិភាព និងរដ្ឋបាលសម្រាប់ Audit |

---

## ៦. បញ្ជី API Endpoints សំខាន់ៗ (API Reference)

### Authentication & Profiles:
- `POST /api/auth/register` — បង្កើតគណនីថ្មី (Student, Mentor, Recruiter)
- `POST /api/auth/login` — ចូលប្រើប្រាស់ និងទទួលយក JWT Token
- `GET /api/auth/profile` — ពិនិត្យព័ត៌មានផ្ទាល់ខ្លួន
- `PUT /api/auth/profile` — កែប្រែព័ត៌មាន Profile និងជំនាញ

### Courses & KHQR Payments:
- `GET /api/courses` — ទាញយកបញ្ជីវគ្គសិក្សាទាំងអស់
- `GET /api/courses/:slug` — មើលព័ត៌មានលម្អិត និងមាតិកាវគ្គសិក្សា
- `POST /api/courses/:id/enroll` — ចុះឈ្មោះរៀនវគ្គសិក្សា Free
- `POST /api/courses/:id/payment/khqr` — បង្កើតកូដ Bakong KHQR សម្រាប់ទូទាត់
- `POST /api/courses/:id/payment/verify` — ផ្ទៀងផ្ទាត់ការទូទាត់ប្រាក់ និងដោះសោវគ្គសិក្សា

### Skill Exchange:
- `GET /api/skill-exchange/matches` — ស្វែងរកដៃគូដែលមានជំនាញត្រូវគ្នា
- `POST /api/skill-exchange/request` — ផ្ញើសំណើដោះដូរជំនាញ
- `PUT /api/skill-exchange/:id/accept` — ទទួលយកសំណើ និងដាក់កាលវិភាគជួប
- `PUT /api/skill-exchange/:id/progress` — កត់ត្រាវឌ្ឍនភាពការរៀន
- `POST /api/skill-exchange/:id/confirm` — បញ្ជាក់ការបញ្ចប់ការដោះដូរ (Dual Confirmation)

### Mentorship & Live Sessions:
- `GET /api/mentors` — ទាញយកបញ្ជី Mentor ដែលត្រូវបានអនុម័ត
- `POST /api/mentors/book` — កក់ម៉ោងណែនាំ 1:1
- `PUT /api/mentors/bookings/:id` — Mentor យល់ព្រម ឬបដិសេធការកក់
- `GET /api/learning-sessions` — មើលកាលវិភាគថ្នាក់រៀន Live
- `POST /api/learning-sessions` — បង្កើតថ្នាក់រៀន Live ថ្មី (Mentor Only)

### Internships, ATS & Career Bridge:
- `GET /api/internships` — ទាញយកបញ្ជីការងារ រួមជាមួយ Skill Match Score
- `POST /api/internships` — បង្ហោះការងារថ្មី (Verified Recruiter Only)
- `POST /api/internships/:id/apply` — សិស្សដាក់ពាក្យស្នើសុំការងារ
- `GET /api/recruiter/applications` — ពិនិត្យបញ្ជីបេក្ខជនក្នុងប្រព័ន្ធ ATS
- `PUT /api/recruiter/applications/:id/status` — ផ្លាស់ប្តូរស្ថានភាពបេក្ខជន និងកំណត់កាលបរិច្ឆេទសម្ភាសន៍
- `GET /api/career/bridge` — វិភាគគម្លាតជំនាញ និងណែនាំ Course បំពេញបន្ថែម

### Real-Time Chat & Messages:
- `GET /api/messages/conversations` — ទាញយកបញ្ជីសន្ទនាបែងចែកតាម Context
- `GET /api/messages/:conversationId` — មើលប្រវត្តិសារក្នុងបន្ទប់ជជែក
- `POST /api/messages` — ផ្ញើសារថ្មី (បញ្ជូនតាម Socket.IO ភ្លាមៗ)

---

## ៧. ប្រព័ន្ធសុវត្ថិភាព និងលទ្ធផលធ្វើតេស្តស្វ័យប្រវត្តិ (Security & Test Verification)

ប្រព័ន្ធបានឆ្លងកាត់ការធ្វើតេស្តស្វ័យប្រវត្តិកម្រិតស៊ីជម្រៅលើ Backend និង Database ដោយទទួលបានលទ្ធផល **100% PASS**:

```
=======================================================
1. Authorization & Security Tests:       10/10 PASSED
2. Skill Exchange Lifecycle Tests:        8/8 PASSED
3. Categorized Messages & Context Tests:  4/4 PASSED
4. Smart Career Bridge & Skill Gap:       ALL PASSED
=======================================================
```

### ចំណុចការពារសុវត្ថិភាពសំខាន់ៗ:
1. **Student Role Isolation:** សិស្សមិនអាចបន្លំបង្កើតការងារ ឬបង្កើតថ្នាក់បង្រៀន Live បានឡើយ (Server ច្រានចោល `403 Forbidden`)។
2. **Unverified Recruiter Guard:** ក្រុមហ៊ុនដែលមិនទាន់ត្រូវបាន Admin ផ្ទៀងផ្ទាត់ មិនអាចប្រកាសការងារជាសាធារណៈបានឡើយ (`403 COMPANY_NOT_VERIFIED`)។
3. **Object-Level Security:** ក្រុមហ៊ុន Recruiter B មិនអាចលួចមើល ឬកែប្រែទិន្នន័យបេក្ខជនរបស់ក្រុមហ៊ុន Recruiter A បានឡើយ (`404/Forbidden`)។
4. **Data Sanitization:** កំណត់ចំណាំសម្ងាត់របស់ក្រុមហ៊ុន (Internal Recruiter Notes) ត្រូវបានលុបចេញដោយស្វ័យប្រវត្តិកុំឱ្យសិស្សមើលឃើញ។
5. **Dual Completion Protocol:** ការដោះដូរជំនាញមិនអាចបញ្ចប់ដោយឯកតោភាគីបានទេ គឺតម្រូវឱ្យភាគីទាំងពីរចុចបញ្ជាក់ទើបប្រព័ន្ធទទួលស្គាល់។

---

## ៨. ការណែនាំអំពីការដំណើរការគម្រោងលើម៉ាស៊ីន (Local Setup & Run Guide)

### លក្ខខណ្ឌតម្រូវ (Prerequisites):
- Node.js v20 ឬ v22+
- Laragon ឬ MySQL Server (ដំណើរការលើ Port 3306 ជាមួយមូលដ្ឋានទិន្នន័យ `final_pro`)
- Git

### ជំហានដំណើរការ (Execution Steps):

#### ជំហានទី ១៖ ដំណើរការ MySQL Database
បើកដំណើរការ Laragon ឬរត់ MySQL daemon:
```powershell
C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqld.exe --standalone --console
```

#### ជំហានទី ២៖ ដំណើរការ Backend REST API (Port 4000)
```powershell
cd "d:\ថ្នាក់សរសេរកូដ ដោយប្រើ AI\Smart_Community_Skill_Career_Development_Platform\backend"
npm install
npm run dev
```
*(ពិនិត្យមើល Health Check: `http://localhost:4000/api/health` នឹងឆ្លើយតប status 200 OK)*

#### ជំហានទី ៣៖ ដំណើរការ Frontend User Application (Port 5173)
```powershell
cd "d:\ថ្នាក់សរសេរកូដ ដោយប្រើ AI\Smart_Community_Skill_Career_Development_Platform\frontend_user"
npm install
npm run dev
```
*(ចូលប្រើប្រាស់តាម Browser: `http://localhost:5173/`)*

#### ជំហានទី ៤៖ ដំណើរការតេស្តសុវត្ថិភាពស្វ័យប្រវត្តិ (Security Test Suites)
```powershell
cd "d:\ថ្នាក់សរសេរកូដ ដោយប្រើ AI\Smart_Community_Skill_Career_Development_Platform"
node ./backend/src/scripts/testAuthorization.js
node ./backend/src/scripts/testSkillExchange.js
node ./backend/src/scripts/testCategorizedMessages.js
node ./backend/src/scripts/testCareerBridge.js
```
*(តេស្តទាំងអស់នឹងដំណើរការ និងបង្ហាញលទ្ធផល PASS គ្រប់តេស្តទាំងអស់)*

---

**រៀបចំ និងចងក្រងដោយ:** ក្រុមការងារគម្រោង Smart Community Skill & Career Development Platform  
**ថ្នាក់សិក្សា:** ថ្នាក់សរសេរកូដ ដោយប្រើ AI (Full-Stack Web Development)
