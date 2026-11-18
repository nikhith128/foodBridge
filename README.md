# FoodBridge AI

FoodBridge AI connects surplus-food donors with nearby NGOs through intelligent matching. This repo holds the React/Vite client and the Express/Prisma API.

**Live demo:** [foodbridge-frontend-6e6p.onrender.com](https://foodbridge-frontend-6e6p.onrender.com/) — hosted on Render. The free tier can sleep, so the first request may take ~30 seconds.

## Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS 3, Framer Motion, React Router 7, Recharts, Leaflet
- **Backend:** Node, Express 5, Prisma 6, MySQL
- **Auth:** JWT

## Quick start

Frontend only (UI work):

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Vite proxies `/api` to `http://localhost:5000`, so no frontend `.env` is needed for local UI work. To check a production build:

```bash
npm run build
npm run preview      # http://localhost:4173
```

Full stack:

```bash
cd backend
npm install
# copy .env.example to .env, then set DATABASE_URL, JWT_SECRET (16+ chars), CLIENT_URL=http://localhost:5173
npm run migrate
npm run seed         # optional: demo accounts and data
npm run dev          # http://localhost:5000
```

## Environment

- Backend: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `PORT` — see `backend/.env.example`
- Frontend: `VITE_API_URL` (defaults to `/api`) — see `frontend/.env.example`
- Never commit `.env` files.

## Layout

- `frontend/src/components` — UI primitives and feature components
- `frontend/src/pages` — public and dashboard screens
- `frontend/src/routes` — route table and guards
- `frontend/src/components/intro` — session splash and staggered hero entrance
- `frontend/design-assets` — reference component sources (not imported by the app)
- `backend/src` — Express app, routes, controllers, services
- `backend/prisma` — schema and migrations
- `design-assets/` — design references and source screens

## More documentation

- `PRD.md` — product requirements
- `Architecture.md` — system design
- `Documentation.md` — implementation notes
- `DEPLOY.md` — deployment guide
- `Phases.md` — delivery phases
- `Design/Design.md` — design direction
