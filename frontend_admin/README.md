# Smart Community Admin Control

Secure React administration dashboard for the Smart Community Skill & Career
Development Platform.

## Features

- Live overview and growth analytics
- User access, role, verification, and suspension management
- Mentor application and company verification workflows
- Internship moderation
- Administrator audit history
- CSV report exports
- Responsive desktop, tablet, and mobile layout

## Local setup

1. Start MariaDB and the backend API.
2. Copy `.env.example` to `.env` if you need a custom API address.
3. Install and run the admin app:

```bash
npm install
npm run dev
```

The admin app opens at `http://localhost:5174`. The backend must allow this
origin in `CLIENT_URL`.

## Environment

```env
VITE_API_URL=http://localhost:4000/api
```

Only accounts with the backend `admin` role can sign in. Never commit admin
credentials or JWT tokens to the repository.

## Production

Deploy this directory as a separate Vercel project with `frontend_admin` as the
Root Directory. Set `VITE_API_URL` to the public HTTPS backend API and add the
deployed admin domain to the backend `CLIENT_URL` allowlist.
