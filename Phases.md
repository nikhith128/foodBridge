# FoodBridge AI: Phases.md (Lean Full-Stack MVP)

Before every step, read PRD.md, Architecture.md and Design/Design.md, then this file. If something is missing or unclear, ASK before guessing.

## Goal
A working full-stack Mvp. The main flow must work end to end:
Create Donation → Matching → NGO Accepts → Pickup → Completed → Impact.

## Stack
- Frontend: React + Vite, Tailwind, Framer Motion, React Router, Recharts, Lucide React.
- Backend: Node.js, Express, Prisma, MySQL, JWT, bcrypt.
- No other library without asking.

## Working rules
1. Do ONE step at a time. Never start the next step on your own.
2. Before each step, show a short plan (files to create or change) and wait for my "go".
3. After each step, show: what was built, the exact commands to run, how I test it, and anything you were unsure about. Then STOP and wait for my "next".
4. Stitch code.html files are visual references only. Build React .jsx components that match the screenshots in Design/screens/. Never paste the HTML.
5. Use the Tailwind tokens from Design.md. No hard-coded hex values.
6. Never commit .env. Keep .env.example with placeholders.
7. Seed data must be clearly demo data. Do not invent real NGOs or statistics.
8. Keep every step small. Do not over-engineer.
9. I am a first-year student. Give exact commands, one at a time, and tell me what I should see when it works.

## Step A: Setup, Schema and Seed
- frontend/ (React + Vite + Tailwind + Router) and backend/ (Express), following the folder structure in Architecture.md.
- Prisma schema: Users, NGOs, Donations, Matches, Pickups with the enums.
- Seed: 1 demo donor, 3 pre-approved NGOs (latitude, longitude, capacity), 5 sample donations.
- .env.example (PORT, DATABASE_URL, JWT_SECRET, CLIENT_URL) and .gitignore.
Done when: both servers start, the database migrates and the seed runs.

## Step B: Auth + Layouts
- Backend: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me. bcrypt, JWT, validation, duplicate-email check, auth and role middleware.
- Frontend: Tailwind tokens, shared components (Button, Input, Badge, Card, Modal, Toast, Tabs, StepTracker), PublicLayout, DashboardLayout (Donor and NGO sidebars), route guards.
- Pages: Home, Register (role selector), Login.
Done when: a user registers, logs in and lands on the correct dashboard, and a wrong role is blocked (check the backend too).

## Step C: Donor Flow + Matching
- Backend: POST/GET /api/donations, GET /api/donations/:id, food eligibility check (preparation time, storage condition and a future collection deadline are required).
- Matching service: filter ineligible NGOs, then score with Capacity 30%, Food Compatibility 25%, Distance 25% (Haversine), Collection Time 20%. Return score, distance and a one-line explanation. GET /api/matches/:donationId.
- Pages: Donor Dashboard, Create Donation, Matching Results (with the note "Matching does not certify food safety.").
Done when: a donor creates a donation and sees ranked NGOs with scores and explanations.

## Step D: NGO Flow + Pickup
- Backend: POST /api/matches/:matchId/accept using a database transaction (no double accept; expired donations cannot be accepted). PATCH /api/pickups/:id/status with validated transitions (ACCEPTED → PICKED_UP → COMPLETED). The NGO updates pickup itself, with no volunteer.
- Pages: NGO Dashboard, Available Donations (with Donation Details and Accept), Pickup Management.
Done when: the NGO accepts a donation, and no other NGO can accept it.

## Step E: Impact
- Backend: GET /api/impact, calculated from COMPLETED donations only.
- Page: Impact Dashboard (label "Sample data for demonstration" while seed data is used).
Done when: completing a donation changes the Impact numbers.

## Step F: Bug Fixing + Mobile Check
- Test: expired donation, double accept, wrong role, missing location, invalid quantity, empty and error states.
- Check every page at 390, 768 and 1440 widths.
- Make sure no secrets are in Git.
Done when: the full flow works without errors.

## Later (only if I ask)
About Us, How It Works, Forgot Password, Volunteer module (OTP pickup), Profile, Notifications, Settings, History pages, route maps, deployment (Vercel + Render + managed MySQL).

## Start command
When I say "Start Step X", do rules 2 and 3 for that step only.