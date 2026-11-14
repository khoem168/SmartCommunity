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

The admin app opens at `http://localhost:5174/admin-console/`. Its Vite proxy
forwards `/api` requests to the local backend on port 4000.

## Environment

```env
VITE_API_URL=/api
```

Only accounts with the backend `admin` role can sign in. Never commit admin
credentials or JWT tokens to the repository.

## Production

Deploy the repository root as one Vercel Services project. The admin app is
mounted at `/admin-console/`; its Vite asset base and React Router basename
match that prefix. Browser API calls use the shared `/api` route. This app has
no server-side functions and therefore no runtime service bindings.

See [the deployment guide](../VERCEL_DEPLOYMENT.md) for all services and settings.
