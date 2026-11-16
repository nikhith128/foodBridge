# Deploy FoodBridge AI (demo)

Frontend = static Vite build. Backend = Node/Express + MySQL. They deploy
separately; the only link between them is `VITE_API_URL`.

## 1. Database

Create a hosted MySQL (Railway, Aiven, PlanetScale…). Copy the connection
string. URL-encode special characters in the password (`@` → `%40`).

```
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/foodbridge"
```

## 2. Backend (Render / Railway)

- Root directory: `backend`
- Build: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start: `npm start`
- Health check: `/api/health`
- Environment:
  - `DATABASE_URL` — from step 1
  - `JWT_SECRET` — a fresh random string, 32+ chars
  - `CLIENT_URL` — the exact frontend origin, e.g. `https://foodbridge.vercel.app`
  - `PORT` — the host sets this; do not hard-code it

Optional demo data (run once): `npm run seed` — on Render, open the backend
service's **Shell** tab and run it there, so it uses the hosted `DATABASE_URL`.
Without it, every login returns `401 Incorrect email or password`.

## 3. Frontend (Vercel / Netlify)

- Root directory: `frontend`
- Build: `npm run build`
- Output: `dist`
- Environment: `VITE_API_URL=https://your-backend.onrender.com/api`

SPA rewrites are already included:
- `frontend/vercel.json` for Vercel
- `frontend/public/_redirects` for Netlify

**Render ignores both files.** A Render Static Site must get the rewrite in the
dashboard, or every route except `/` returns 404 on load/refresh:

- Dashboard → your static site → **Redirects/Rewrites** → Add
- Source: `/*`
- Destination: `/index.html`
- Action: **Rewrite** (not Redirect)

## 4. Verify

- `/login` loads and the seeded accounts sign in
- Refreshing `/donor/donations` does not 404
- `/dev/components` and `/dev/tokens` show “Page not found”
- Browser console has no red errors

## Notes

- Free backend tiers sleep; the first request can take ~30 s.
- `backend/.env` is local only — never upload it.
- Rotate `JWT_SECRET` for production; all existing tokens become invalid.
