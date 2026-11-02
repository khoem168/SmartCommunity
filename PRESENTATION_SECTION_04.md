# Section 04 — Key Platform Innovations, Integrations & Live Demo

Presentation-ready content for the **Smart Community Skill & Career Development Platform**.

## Verified project scope

The following presentation content is based on features that exist in the codebase:

- Smart Career Bridge: Skill match score algorithm comparing student profile skills against internship requirements, identifying exact skill gaps and linking relevant courses.
- Skill Exchange Lifecycle: Complementary algorithm matching `user_skills.teach` and `user_skills.learn`, duplicate request prevention, dual confirmation of completion.
- Categorized Real-Time Chat: Socket.IO multi-room messaging with automated context linking (Job Applications, Mentorship Sessions, Skill Swaps).
- Bakong KHQR Payment Flow: Dynamic QR generation, server-side MD5 transaction verification, instant course enrollment.
- WebRTC Video Integration: Seamless Jitsi Meet session rooms embedded directly into the browser.

---

## Slide 12 — Smart Career Bridge & Skill Gap Analysis

### Transforming Coursework into Verifiable Job Readiness

```
[ Student Profile Skills ]       [ Internship Requirements ]
• React                          • React
• JavaScript                     • JavaScript
• HTML/CSS                       • Node.js  <-- (Missing Skill Gap!)
              \                 /
               ▼               ▼
         [ Automated Match Engine ]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   [ 67% Match Score ]   [ Recommended Bridge Course ]
   High Candidacy        "Backend with Node.js & Express"
```

#### Technical Implementation:
- **Set Intersection Algorithm:** Compares normalized candidate skills against array of internship requirements.
- **Match Score Calculation:** Returns percentage match (`matchedCount / totalRequired * 100`) directly on public and authenticated job listings.
- **Direct Course-to-Job Bridge:** When a student lacks a required skill, the platform dynamically recommends the exact platform course that teaches that skill!

### Speaker notes — Khmer

> នៅក្នុង Slide 12 នេះ ខ្ញុំសូមបង្ហាញពីមុខងារច្នៃប្រឌិតខ្ពស់បំផុតមួយរបស់ប្រព័ន្ធ គឺ **Smart Career Bridge**៖
> ជំនួសឱ្យការគ្រាន់តែបង្ហាញបញ្ជីការងារធម្មតា ប្រព័ន្ធរបស់យើងបានដាក់បញ្ចូលក្បួនគណនា (Algorithm) ដើម្បីប្រៀបធៀបជំនាញរបស់សិស្ស ជាមួយនឹងតម្រូវការរបស់ការងារនីមួយៗ។
> ប្រសិនបើសិស្សមានជំនាញត្រូវ 67% ប្រព័ន្ធនឹងបង្ហាញពិន្ទុ Match Score យ៉ាងច្បាស់។
> អ្វីដែលពិសេសជាងនេះ ប្រព័ន្ធនឹងប្រាប់សិស្សថាតើគាត់ខ្វះជំនាញអ្វី (Skill Gap) ហើយណែនាំ Course នៅក្នុង Platform របស់យើងដែលបង្រៀនជំនាញនោះភ្លាមៗ ដើម្បីឱ្យគាត់រៀនបំពេញបន្ថែម និងអាចដាក់ពាក្យបានជោគជ័យ!

**Suggested speaking time:** 65–75 seconds

---

## Slide 13 — Peer Skill Exchange Lifecycle & State Machine

### Learn by Teaching: The P2P Knowledge Marketplace

```
[ Student A ] (Teaches: React | Wants: Figma)
      ↕  Automated Compatibility Match
[ Student B ] (Teaches: Figma | Wants: React)
      │
      ▼
[ 1. Pending Request ] ──► [ 2. Accepted & Meeting Set ] ──► [ 3. Progress Logged ]
      │                                                              │
      ▼                                                              ▼
(Duplicate Prevention)                                   [ 4. Dual Confirmation ]
                                                         Both must confirm 100%
                                                                     │
                                                                     ▼
                                                         [ 5. Exchange Completed ]
```

#### Security & Lifecycle Enforcements:
- **Prevent Self-Swaps & Duplicates:** Server-side validation prevents users from requesting swaps with themselves or creating redundant active requests.
- **Object-Level Guard:** Only the designated recipient can accept a request (Tested & Verified: PASS).
- **Dual Confirmation Protocol:** Exchange is marked completed only when **both** participants submit completion confirmation, ensuring accountability.

### Speaker notes — Khmer

> មុខងារពិសេសទីពីរ គឺ **Peer Skill Exchange (ការដោះដូរជំនាញរវាងសិស្ស និងសិស្ស)**៖
> សិស្សមិនចាំបាច់មានលុយទើបអាចរៀនបានទេ។ ប្រសិនបើសិស្ស A ចេះ React ចង់រៀន Figma ហើយសិស្ស B ចេះ Figma ចង់រៀន React ប្រព័ន្ធនឹងផ្គូផ្គងពួកគាត់ដោយស្វ័យប្រវត្តិ។
> ដំណើរការនៃការដោះដូរត្រូវបានការពារដោយច្បាប់ម៉ាស៊ីន (State Machine)៖
> ចាប់ពីការផ្ញើសំណើ (Pending), ការទទួលយក និងកំណត់កាលបរិច្ឆេទជួប (Accepted), ការកត់ត្រាវឌ្ឍនភាព (Progress Tracking), និងចុងក្រោយគឺការបញ្ជាក់ពីភាគីទាំងសងខាង (Dual Confirmation) ទើបប្រព័ន្ធចាត់ទុកថាការដោះដូរបានបញ្ចប់ 100%។

**Suggested speaking time:** 60–75 seconds

---

## Slide 14 — Real-Time Communication & Contextual Messaging

### Fast, Organized Conversations Powered by Socket.IO

#### Contextual Inbox Categorization:
Rather than a messy single inbox, our chat engine automatically categorizes conversations based on the user relationship:
- 💼 **Job Inboxes:** Candidate conversations automatically display job title, application status, and CV link in the chat header.
- 🎯 **Skill Swap Inboxes:** Participant conversations display current swap progress (%) and quick Jitsi meeting buttons.
- 👥 **General & Mentorship Inboxes:** Direct 1:1 member guidance and community chats.

#### Real-Time Engine Details:
- Authenticated WebSocket rooms (`socket.join('user_' + userId)`).
- Instant message broadcast with zero page refresh.
- Real-time unread message counters synced with desktop and mobile navbar badges.

### Speaker notes — Khmer

> ចំពោះប្រព័ន្ធទំនាក់ទំនង **Real-Time Chat** ដែលដំណើរការដោយ Socket.IO៖
> យើងមិនមែនគ្រាន់តែបង្កើតប្រអប់សារធម្មតានោះទេ ប៉ុន្តែជា **Contextual Messaging**៖
> នៅពេលសិស្សជជែកជាមួយក្រុមហ៊ុន ប្រអប់ Chat នឹងបង្ហាញព័ត៌មានការងារ ស្ថានភាពពាក្យស្នើសុំ និងតំណភ្ជាប់ CV លើក្បាល Chat តែម្តង។
> នៅពេលជជែកក្នុងការដោះដូរជំនាញ Chat នឹងបង្ហាញភាគរយវឌ្ឍនភាព និងប៊ូតុងចុចចូលប្រជុំ Jitsi ភ្លាមៗ។
> សារទាំងអស់ត្រូវបានបញ្ជូនភ្លាមៗ (Instant Delivery) ដោយមិនបាច់ Refresh ទំព័រឡើយ។

**Suggested speaking time:** 55–65 seconds

---

## Slide 15 — Cambodia National Payment Standard: Bakong KHQR

### Frictionless, Verifiable Payments for Premium Learning

```
[ Student Clicks Enroll ] ──► [ Backend Generates KHQR String ]
                                          │
                                          ▼
[ Student Scans with Any Bank App ] ──► [ Real-Time Payment Verified via MD5 ]
(ABA, ACLEDA, Canadia, etc.)              │
                                          ▼
                               [ Automatic Enrollment Granted ]
                               [ Access Unlocked in Classroom ]
```

#### Why Bakong KHQR Matters:
1. **Financial Inclusion:** Accessible to anyone with a Cambodian bank account without requiring international credit cards (Visa/Mastercard).
2. **Server-Side Integrity:** The QR code amount is generated strictly on the Express backend using the official course price in the database.
3. **Instant Verification:** The backend verifies transaction success and updates the student's enrollment record immediately, granting instant access to course videos and materials.

### Speaker notes — Khmer

> ចំពោះការទូទាត់ប្រាក់វគ្គសិក្សា **Bakong KHQR**៖
> នេះគឺជាមោទនភាពមួយនៃគម្រោងរបស់យើង ដែលបានភ្ជាប់ស្តង់ដារទូទាត់ជាតិរបស់កម្ពុជា៖
> សិស្សអាចប្រើ App ធនាគារណាក៏បាននៅកម្ពុជា (ABA, ACLEDA, Canadia...) ដើម្បី Scan ទូទាត់។
> ប្រព័ន្ធដំណើរការដោយស្វ័យប្រវត្តិ៖ នៅពេលសិស្សចុចទិញវគ្គសិក្សា Server នឹងបង្កើតកូដ KHQR តាមតម្លៃពិតប្រាកដ។ ពេលសិស្ស Scan បង់ប្រាក់រួច Server នឹងផ្ទៀងផ្ទាត់ភ្លាមៗ ហើយបើកសិទ្ធិចូលរៀនវគ្គសិក្សានោះដោយស្វ័យប្រវត្តិ ដោយមិនចាំបាច់មានមនុស្សមក Approve ដោយដៃឡើយ។

**Suggested speaking time:** 55–65 seconds

---

## Recommended visual style

- Feature real Bakong KHQR code mockups and mobile banking scan diagrams.
- Use flowcharts with clear color markers for state transitions.

## Recommended section timing

| Slide | Content | Time |
|---|---|---:|
| Slide 12 | Smart Career Bridge & Skill Gap | 65–75 seconds |
| Slide 13 | Peer Skill Exchange Lifecycle | 60–75 seconds |
| Slide 14 | Real-Time Contextual Chat | 55–65 seconds |
| Slide 15 | Bakong KHQR Payment Flow | 55–65 seconds |
| **Total** | **Section 04** | **~4 minutes** |

## Likely teacher questions and clear answers

### 1. How does the Career Bridge calculate skill matches?
The server extracts the student's validated skills from `user_skills` and compares them with the JSON array of requirements in `internships.requirements`. It performs case-insensitive normalization and computes the percentage of matched requirements.

### 2. Is the Bakong KHQR integration secure against fake payments?
Yes. The payment verification requires a server-to-server check comparing the transaction hash and amount. The client cannot forge a payment confirmation; access is only granted when the MySQL `course_payments` record is confirmed valid by the server.
