# Smart Community User Web

React user application for the Smart Community Skill & Career Development
Platform.

## Development

```bash
npm install
npm run dev
```

The default frontend URL is `http://localhost:5173`. The Vite proxy forwards
`/api`, `/socket.io`, and `/uploads` to the backend on port 4000. Use the same
origin by default, or configure a separately hosted API in `.env`:

```env
VITE_API_URL=/api
```

## Course learning and KHQR

For deployment with all four services, see [the Vercel guide](../VERCEL_DEPLOYMENT.md).

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
