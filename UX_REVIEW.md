# Smart Community UX review and implementation

## Scope and evidence

Reviewed the React route inventory, public/member navigation, Home sections,
course search, existing hero motion, and scroll invitation. Inspected rendered
Home in English/Khmer at desktop, tablet and phone widths. This is a presentation
and navigation review, not a claim that every backend workflow was tested.

References:

- [Google Antigravity](https://antigravity.google/): a reference for a focused
  introduction, distinct product sections and visual storytelling. The new
  illustration is original CSS, not copied artwork.
- [Nielsen Norman Group: progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/):
  expose essential choices first and make additional tools available on request.
- [W3C: animation from interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions):
  respect reduced-motion preferences for nonessential interaction animation.

## Findings and decisions

| Observed issue | Implemented response |
| --- | --- |
| A tilting stock photo did not communicate the requested 3D learning identity | Local CSS laptop, code editor, books, sphere and floating learning cards; pointer depth reuses the existing hero handler |
| Hero search chips competed with main actions | Search remains visible; popular suggestions expand on request |
| Many modules lacked a single obvious discovery point | Three task groups plus an expandable directory with 15 general destinations |
| Signed-in navigation omitted the course library | Added Learning alongside existing member links |
| A large promotion appeared automatically while reading | A small dismissible invitation appears first; click opens the original panel and actions |
| Persona selection had no pressed-state semantics | Added aria-pressed without changing the selection logic |
| Home relied on a large external image for its main visual | The replacement scene uses local markup/CSS/icons, no remote image or new runtime dependency |
| Forum controls remained English in Khmer mode | Added bilingual listing/composer controls, localized dates and accessible search/filter labels; user-created posts remain unchanged |
| Forum showed an empty community after an API failure | Added a separate load-failure state and retry action |

## Feature preservation

No route definitions, auth guards, backend endpoints, payment logic, messages,
enrollment or application handlers were removed in this iteration.

| Task | Existing destination |
| --- | --- |
| Courses and enrollment | `/courses`, course detail routes |
| Live classes | `/sessions`, session detail/room routes |
| Mentorship | `/mentorship`, mentor detail routes |
| Community and skill exchange | `/community`, `/discover`, `/skill-requests` |
| Discussion and messages | `/forum`, `/messages` |
| Career planning and opportunities | `/career`, `/jobs`, `/applications` |
| Personal workspace | `/dashboard`, `/profile`, `/notifications`, `/settings` |
| Recruitment and administration | Existing role-dependent `/my-posts`, `/admin` |

Existing persona content, ecosystem cards, tracks, team carousel, journey, FAQ,
search and navigation remain. The directory adds links, not a second copy of
the corresponding business logic. Protected links continue through existing
authentication guards.

## Validation and limits

- Frontend lint and production build.
- Browser layout checks at 1440, 768, 390 and 320 pixels in English and Khmer.
- Directory expansion and destinations, persona selection, search suggestions,
  reduced motion and browser exceptions.
- The illustration is decorative; its code is illustrative, not a real editor.
- Public Courses, Mentorship, Career, Jobs, Community and Forum checked at 390px;
  API-backed content still depends on backend availability.
- Existing APIs still need integration testing with the configured backend and
  appropriate student, mentor, recruiter and administrator accounts.
- Older CSS layers remain in Home.css; the current hero layout is maintained in
  CampusHome.css. Consolidating unrelated legacy styles requires broader page
  regression coverage.

## Refined visual direction

The latest composition combines a quiet white canvas, restrained glass only in
navigation, a framed coding illustration, and real project-team portraits linking
to the community. It retains navy/blue with a small gold accent. The headline is
shorter in both languages, and search sits below the main introduction.
`CampusHome.css` replaces the prior `HomeModern.css` import rather than loading
both competing hero treatments.

## Suggested exam demonstration

Start with the Khmer Home page, demonstrate the 3D illustration and task groups,
then expand the directory. Follow a student task (course search), a teacher task
(mentorship or sessions), and a career task. Use real test accounts for the
connected workflows. Show the phone layout and reduced-motion mode to explain
accessibility choices.
