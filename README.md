# Service Request Board

This is the Service Request Board application — a Next.js full-stack app (client + API routes) using MongoDB Atlas for persistence. It provides signup/login, a request creation form, an owner dashboard with server-side search, filters, sorting, and infinite pagination.

## Features

- Signup / Login (JWT auth with auto-login)
- Create requests (stored in MongoDB Atlas)
- Dashboard with request list and details
- Server-side search, filters, and sorting
- Server pagination + client infinite scroll
- In-app confirmation modal for deletes (no native confirm)
- Toast notifications for create/delete (create toast persists across navigation)

## Quick start (development)

1. Prerequisites

- Node.js 18+ and npm installed
- A MongoDB Atlas cluster (free tier works)

2. Clone the repo

```bash
git clone https://github.com/PasanPiyumal/ServiceBoard
cd ServiceBoard/my-app
```

3. Install dependencies

```bash
npm install
```

4. Create a `.env` file in `my-app/` with the following (replace placeholders)

```env
MONGODB_URI="<your-mongodb-connection-string>"
JWT_SECRET="a-strong-secret-for-jwt"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
# Add other env vars as needed
```

5. Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Test account (local testing)

You can create an account using the app's Signup page, or use the test credentials below to log in immediately in a local environment:

- Email: pasan@gmail.com
- Password: pasan1234

> NOTE: These credentials are for local testing only — do not use them in production.

## Build for production

```bash
npm run build
npm run start
```

## API endpoints (summary)

- `POST /api/auth/signup` — create an account
- `POST /api/auth/login` — login and receive token
- `GET /api/requests` — list requests (supports query params: `mine`, `q`, `status`, `page`, `limit`, `sort`)
- `POST /api/requests` — create request
- `PATCH /api/requests/:id` — update request status
- `DELETE /api/requests/:id` — delete request

## Deployment

- Provide `MONGODB_URI` and `JWT_SECRET` in your host's environment
- Build and start with `npm run build` / `npm run start`

## Repository

- GitHub repo name: `ServiceBoard`

Push your local changes to GitHub:

```bash
git remote add origin git@github.com:<your-username>/ServiceBoard.git
git branch -M main
git push -u origin main
```

## Troubleshooting

- If you see stale UI changes after editing, kill any stale dev server processes (port conflicts can cause the app to run on a different port). On Windows, kill the process holding port 3000 and restart `npm run dev`.
- If the add/delete toast does not appear, hard-refresh the page (Ctrl+F5) to clear cached bundles.

## Next steps (optional)

- Add a seed script to automatically create the test user in MongoDB
- Make toast wording and styles fully consistent across the app
- Add CI/CD deploy instructions for Vercel or another host

## Contact

Owner / test account: pasan@gmail.com
