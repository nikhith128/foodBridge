# FoodBridge AI: DESIGN.md (Master Build Prompt)

You are a senior frontend engineer. Read this whole file before writing any code. Follow it exactly. If something is missing or unclear, ASK before guessing.

## 1. Project
FoodBridge AI is an AI-assisted food rescue platform. Donors (restaurants, hotels, canteens, bakeries) post surplus food. NGOs get ranked recommendations and accept donations. Volunteers handle pickup and delivery.
Tagline: "Rescue Food. Connect Communities. Reduce Waste."

## 2. Source of truth
- Screens exported from Google Stitch are in `design/screens/`.
- Screenshots (png) = the visual truth. Match them.
- `code.html` files = reference only. NEVER paste them into the app. Rebuild every screen as React components.
- If a screen and this file disagree, follow the screen and tell me about the difference.

## 3. Tech stack (frontend only for now)
- React + Vite, Tailwind CSS, Framer Motion, React Router.
- Charts: Recharts. Maps: Leaflet + OpenStreetMap. Icons: Lucide React.
- Do NOT add any other library without asking me first.
- Backend (Node, Express, MySQL, Prisma) comes later. For now use mock data.

## 4. Folder structure
frontend/src/
- components/ui/ (Button, Input, Select, Badge, Card, Modal, Toast, Tabs, Skeleton, EmptyState, StepTracker)
- components/shared/ (StatCard, DonationCard, MatchCard, TaskCard, DataTable, MapCard, NotificationItem)
- layouts/ (PublicLayout, DashboardLayout)
- pages/public/, pages/donor/, pages/ngo/, pages/volunteer/, pages/shared/
- data/mockData.js (ALL sample data lives here)
- routes/ (route config and role guards)
- utils/, hooks/, context/

## 5. Design tokens
Put these in `tailwind.config.js` under `theme.extend`. Never hard-code hex values in components.

| Token | Value |
|---|---|
| primary | #16A34A (FILL: verify) |
| primary-dark | #14532D (FILL: verify) |
| mint | #F0FDF4 (FILL: verify) |
| amber (urgent) | #F59E0B (FILL: verify) |
| text | #1F2937 (FILL: verify) |
| muted text | #6B7280 |
| border | #E5E7EB |
| error | #DC2626 |
| info | #2563EB |
| page background (dashboards) | #F9FAFB |

- Font: Poppins or Inter (FILL: check the Stitch files).
- Radius: 12px inputs and buttons, 16px cards.
- Inputs are 48px tall. Spacing: 24-32px on desktop, 16-24px on mobile.
- Breakpoints: mobile 390, tablet 768, desktop 1440.
- Colour contrast must meet WCAG AA.

## 6. Status badge colours (single source: components/ui/Badge)
AVAILABLE = green | ACCEPTED = blue | ASSIGNED = purple | PICKED_UP = teal | COMPLETED = dark green with check icon | EXPIRED = grey | CANCELLED = red | URGENT = amber with clock icon | VERIFIED = green with shield icon | UNVERIFIED = grey with info icon | Veg = green dot | Non-Veg = red dot.
(FILL: confirm exact shades from the style guide screen.)

## 7. Layouts
**PublicLayout:** sticky navbar (logo, Home, About Us, How It Works, Login, Register) + shared dark green footer.
**DashboardLayout:** dark green sidebar 260px (collapsible to icons), top bar 72px (page title, breadcrumb, search, bell with unread dot, avatar dropdown), content area with 32px padding.
- Donor only: green "+ Create Donation" button in the top bar.
- Mobile: sidebar becomes a drawer, plus a bottom navigation bar.
- Volunteer mobile bottom nav: Dashboard, Tasks, Notifications, Profile.

## 8. Role sidebars
- DONOR: Dashboard, Create Donation, My Donations, Matching Results, Pickup Details, Impact Dashboard, Notifications, Profile, Settings.
- NGO (with "Verified" badge by the role): Dashboard, Available Donations, Matching Recommendations, My Accepted Donations, Pickup Management, Donation History, Impact Dashboard, Notifications, Profile, Settings.
- VOLUNTEER: Dashboard, Available Tasks, My Tasks, Impact Dashboard, Notifications, Profile, Settings.
Role access must also be enforced by route guards, not only by hiding menu items.

## 9. Page inventory
Fill the last column after you check `design/screens/`. Mark any page with no screen as MISSING.

| # | Page | Route | Role | Screen folder |
|---|---|---|---|---|
| 1 | Home | / | Public | stitch_foodbridge_ai_platform_landing_page |
| 2 | About Us | /about | Public | MISSING |
| 3 | How It Works | /how-it-works | Public | MISSING |
| 4 | Register | /register | Public | stitch_foodbridge_ai_platform_landing_page (1) |
| 5 | Login | /login | Public | stitch_foodbridge_ai_platform_landing_page (2) |
| 6 | Forgot / Reset Password | /forgot-password | Public | MISSING |
| 7 | Donor Dashboard | /donor | Donor | stitch_foodbridge_ai_platform_landing_page (3) |
| 8 | Create Donation | /donor/create-donation | Donor | stitch_foodbridge_ai_platform_landing_page (4) |
| 9 | My Donations (tabs: Active, Completed, Expired, Cancelled; also acts as history) | /donor/donations | Donor | stitch_foodbridge_ai_platform_landing_page (6) |
| 10 | Donation Details | /donor/donations/:id | Donor | MISSING |
| 11 | Matching Results | /donor/donations/:id/matches | Donor | stitch_foodbridge_ai_platform_landing_page (5) |
| 12 | Pickup Details | /donor/pickups/:id | Donor | stitch_foodbridge_ai_platform_landing_page (7) |
| 14 | NGO Dashboard | /ngo | NGO | stitch_foodbridge_ai_platform_landing_page (8) |
| 15 | Available Donations | /ngo/donations | NGO | stitch_foodbridge_ai_platform_landing_page (9) |
| 16 | Donation Details | /ngo/donations/:id | NGO | stitch_foodbridge_ai_platform_landing_page (10) |
| 17 | Matching Recommendations | /ngo/recommendations | NGO | stitch_foodbridge_ai_platform_landing_page (11) |
| 18 | My Accepted Donations | /ngo/accepted | NGO | MISSING |
| 19 | Pickup Management | /ngo/pickups | NGO | stitch_foodbridge_ai_platform_landing_page (12) |
| 20 | Donation History | /ngo/history | NGO | stitch_foodbridge_ai_platform_landing_page (13) |
| 21 | Volunteer Dashboard | /volunteer | Volunteer | stitch_foodbridge_ai_platform_landing_page (14) |
| 22 | Available Tasks | /volunteer/tasks | Volunteer | stitch_foodbridge_ai_platform_landing_page (15) |
| 23 | My Tasks | /volunteer/my-tasks | Volunteer | stitch_foodbridge_ai_platform_landing_page (16) |
| 24 | Task Details | /volunteer/tasks/:id | Volunteer | stitch_foodbridge_ai_platform_landing_page (17) |
| 25 | My Profile | /app/profile | All | MISSING |
| 26 | Edit Profile | /app/profile/edit | All | MISSING |
| 27 | Notifications | /app/notifications | All | MISSING |
| 28 | Settings | /app/settings | All | MISSING |
| 29 | Impact Dashboard | /app/impact | All | MISSING |

If the Stitch files show merged pages (for example tabs instead of separate pages), follow the Stitch files and note it under "Open questions".

## 10. Shared pages (25 to 29): role-based content
Build each page ONCE. The content changes by role.
- **25 My Profile:** header card (avatar, name, role badge, email, phone, member since, Edit Profile button), Personal Information card, My Activity card. Role card: Donor = business name, donor type, pickup address, map. NGO = organisation name, address, capacity, food preference chips, availability, Verified/Unverified badge, map. Volunteer = city, availability chips, own vehicle.
- **26 Edit Profile:** same layout with editable fields, avatar upload (Change photo, Remove), email read-only with a lock icon, sticky bottom bar (Save Changes, Cancel). Role fields as in page 25, plus: NGO has the "Currently accepting donations" toggle and the note "Changes to organisation details may require re-verification." Volunteer has the "Has own vehicle" toggle. States: validation errors, saving, success toast, unsaved-changes modal.
- **27 Notifications:** "Mark all as read", tabs (All, Unread, Donations, Pickups, System), grouped by Today / Yesterday / Earlier, each item has an icon, title, message, time, unread dot and a menu (Mark as read, Delete). Clicking opens the related page. Simple in-app list only (no real-time push in the MVP).
- **28 Settings:** tabs Account, Security, Notifications, Danger Zone. Security has Change Password with a strength bar. Notification toggles use role-based labels (NGO: "New donations near me", Volunteer: "New tasks near me"). Delete Account requires typing DELETE. MVP: skip Language and Logged-in devices unless I ask.
- **29 Impact Dashboard:** "Our Impact" and the date filter (7 days, 30 days, All time), 5 stat cards (Completed Donations, Estimated Meals Rescued, Active Donations, Completed Pickups, Participating Organisations), charts (Meals Over Time, Donations by Status donut, Donations by Category), Top Contributors, Recent Completed Donations table, and the label "Sample data for demonstration". Volunteer view is limited: no top contributors, but with distance travelled and achievement badges.

## 11. System states (build into every relevant page)
Loading (skeletons), Empty (message plus button), Error (message plus Retry), Success (toast), Validation (inline red messages), Expired (grey banner), Unavailable ("Another NGO/volunteer already accepted this"), Restricted (no permission), Confirmation (modal), Offline (top banner).
Use the shared Skeleton, EmptyState, Toast and Modal components. Do not rebuild them per page.

## 12. Business rules the UI must respect
- Donation lifecycle: AVAILABLE → ACCEPTED → ASSIGNED → PICKED_UP → COMPLETED (plus EXPIRED, CANCELLED).
- Match score weights: Capacity 30%, Food Compatibility 25%, Distance 25%, Collection Time 20%.
- Always show the note: "Matching does not certify food safety."
- Only donors see NGO matches. Only NGOs accept donations. Volunteers confirm pickup with a 4-digit OTP.
- Expired donations cannot be accepted. Accepted donations disappear for other NGOs.
- Do not invent data, locations or coordinates. Sample data must be labelled "Sample data".

## 13. Rules for you (the AI)
1. Build in this order: tokens and Tailwind config → ui components → shared components → layouts → public pages → the main flow (Create Donation → Matching Results → NGO Accept → Pickup → Impact) → remaining pages.
2. Build ONE page at a time. After each page, stop and wait for my approval.
3. Mobile-first. Test at 390, 768 and 1440.
4. Use mock data only, from `data/mockData.js`.
5. Reuse components. If you copy the same markup twice, make it a component.
6. Do not touch backend files in this task.
7. If a screen is missing, say so and propose a layout based on the closest screen. Do not silently invent a design.
8. At the end of every task, list: files created, files changed, and anything you were unsure about.

## 14. Open questions
(Add here: missing pages, merged pages, colour differences between screens.)