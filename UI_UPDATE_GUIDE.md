# Smart Community — UI update guide

The connected application is in `frontend_user`. `smart-community-full.html`
is a standalone reference demo; editing it does not update the React application.

## Run and check

```powershell
cd frontend_user
npm run dev
```

Use the local URL Vite prints. Start the backend separately using the repository
README for sign-in, saved profiles, payment and other database features.
Before deployment, run `npm run check` in `frontend_user`.

## Where to change the design

- `src/ios-glass.css`: iOS-inspired translucent navigation, rounded controls,
  cool gradient backgrounds, dark hero and accessibility fallbacks. The standalone
  `smart-community-full.html` also includes its own matching style block; its demo
  functions are separate from the React application's backend.

- `src/pages/home/CampusHome.css`: final home hero layout, illustration frame,
  desktop/mobile sizing and Khmer heading spacing. Imported after `Home.css`.
- `src/design-refresh.css`: shared colors, navigation, cards and focus styles.
- `src/components/ui/TiltCard.jsx`: subtle pointer tilt for course cards. Touch
  devices and reduced-motion preferences disable the effect.
- `src/pages/home/Home.jsx`: real navigation, search, statistics and hero content.
- `src/i18n/translations.js` and `src/i18n/refresh.js`: English/Khmer wording.
- Individual page CSS files: module-specific layouts.

Keep route destinations, service calls, form names and permissions when changing
visual markup. Start with CSS for spacing, colors, corners and typography.
Do not replace connected pages with the standalone HTML demo.

## Before the final exam

1. Check English and Khmer at phone and laptop widths.
2. Use keyboard Tab to reach menus, search, cards and forms.
3. Enable reduced motion in the operating system and check that content remains visible.
4. Search on Home; confirm Courses displays the same search and filters correctly.
5. With test accounts, demonstrate login, courses, skill exchange, mentorship,
   sessions, career plans, internship applications, forum, chat and notifications.
6. Verify recruiter/admin permissions and payment using the project's configured
   test workflow. A successful frontend build alone cannot verify these services.
7. Deploy through the existing Vercel project, then repeat the important flows
   against its configured backend.

The React hero now uses `components/ui/LearningScene.jsx` and its CSS: a local
3D-style coding illustration. It does not need an external photo. Other sections
still contain external photos. `FeatureDirectory.jsx` groups existing routes;
edit labels and route entries there when adding a module. See `UX_REVIEW.md`
for the design rationale, preserved features and validation scope.
