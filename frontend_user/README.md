# Smart Community User Web

React user application for the Smart Community Skill & Career Development
Platform.

## Development

```bash
npm install
npm run dev
```

The default frontend URL is `http://localhost:5173`. Configure the backend API
in `.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

## Course learning and KHQR

The `/courses` experience loads its catalog from MariaDB and includes:

- Searchable, responsive course cards
- A free first lesson preview
- Embedded YouTube lesson videos
- Attached PDF learning resources
- Server-enforced premium lesson locks
- Bakong KHQR generation and automatic payment polling
- Enrollment unlock after backend payment confirmation

The user must be logged in before purchasing. The login page safely returns the
user to the requested course after authentication. Course amounts are not sent
by the frontend; the backend reads the trusted price and currency from the
course record.

## Validation

```bash
npm run lint
npm run build
```
