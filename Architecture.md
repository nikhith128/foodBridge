# FoodBridge AI – Architecture.md

## 1. Introduction

This document describes the technical architecture of FoodBridge AI, an AI-assisted food rescue platform that connects surplus-food donors with nearby NGOs and food recovery organisations.

It defines the technology stack, frontend and backend structure, database design, API endpoints, matching engine, application workflow, and security mechanisms.

The architecture is designed to be modular, maintainable, and practical to implement within a 12–24-hour hackathon.

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js + Vite | Build the user interface |
| Styling | Tailwind CSS | Responsive UI design |
| Animations | Framer Motion | Smooth animations |
| Backend | Node.js | Server-side runtime |
| Framework | Express.js | Backend API development |
| Database | MySQL | Relational data storage |
| ORM | Prisma | Database queries and management |
| Authentication | JWT | User authentication |
| Password Security | bcrypt | Password hashing |
| Maps | Leaflet + OpenStreetMap | Location and map integration |
| Version Control | Git + GitHub | Source-code management |
| Deployment | Vercel + Render | Application hosting |

## 3. System Overview

FoodBridge AI follows a client-server architecture.

The React frontend communicates with the Node.js and Express backend through REST APIs.

The backend processes requests, handles authentication, manages donations, executes the matching algorithm, and communicates with the MySQL database through Prisma ORM.

### Main Workflow

1. Donor registers or logs in.
2. Donor submits surplus-food details.
3. Backend validates the donation.
4. Food eligibility and safety checks are performed.
5. Matching engine identifies suitable NGOs.
6. Eligible NGOs are ranked based on matching criteria.
7. NGO reviews and accepts the donation.
8. Pickup or delivery is coordinated.
9. Donation status is updated.
10. Impact statistics are recorded.

## 4. High-Level System Architecture

```text
                 USERS
       ┌──────────┼──────────┐
       │          │          │
     Donor       NGO     Volunteer
       │          │          │
       └──────────┼──────────┘
                  |
            REACT FRONTEND
                  |
             REST APIs
                  |
          NODE.JS + EXPRESS
                  |
       ┌──────────┼──────────┐
       │          │          │
 Authentication Donation  Matching
    Service     Service    Engine
       │          │          │
       └──────────┼──────────┘
                  |
              PRISMA ORM
                  |
               MYSQL
                  |
          RELATIONAL TABLES
```

## 5. Frontend Architecture

The frontend will be developed using React.js and Vite.

It provides different interfaces based on user roles.

### Main Pages

- Landing Page
- Login and Registration
- Donor Dashboard
- Create Donation
- Donation Details
- NGO Dashboard
- Matching Recommendations
- Volunteer Dashboard (simplified MVP)
- Profile and Settings

### Proposed Folder Structure

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── index.html
└── package.json
```

### Folder Responsibilities

- components/: Reusable UI components.
- pages/: Individual application pages.
- layouts/: Shared page and dashboard layouts.
- services/: API communication with the backend.
- hooks/: Reusable React hooks.
- context/: Shared authentication and user state.
- utils/: Helper functions.
- assets/: Images, icons and other static assets.

## 6. Backend Architecture

The backend will use Node.js and Express.js.

It handles incoming API requests, validates information, communicates with MySQL through Prisma ORM, and executes application business logic.

### Proposed Folder Structure

```text
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
├── .env
└── package.json
```

### Folder Responsibilities

- prisma/: Prisma schema and database configuration.
- config/: Application configuration.
- controllers/: Handle incoming requests and responses.
- middleware/: Authentication, authorization and validation.
- routes/: Define API endpoints.
- services/: Business logic and matching algorithm.
- utils/: Reusable helper functions.
- server.js: Configure and start the Express server.

## 7. Database Architecture – MySQL

FoodBridge AI will use MySQL as its relational database.

Prisma ORM will be used to communicate with MySQL from the backend.

### 7.1 Database Tables

#### A. Users

Stores account and authentication information.

| Field | Type | Description |
|---|---|---|
| id | INT | Primary key |
| name | VARCHAR | User name |
| email | VARCHAR | Unique email |
| password | VARCHAR | Hashed password |
| role | ENUM | DONOR, NGO, VOLUNTEER |
| phone | VARCHAR | Contact number |
| created_at | DATETIME | Account creation time |

#### B. NGOs

Stores NGO organisation details.

| Field | Type | Description |
|---|---|---|
| id | INT | Primary key |
| user_id | INT | Foreign key referencing users |
| organisation_name | VARCHAR | NGO name |
| address | TEXT | Organisation address |
| latitude | DECIMAL | Location latitude |
| longitude | DECIMAL | Location longitude |
| storage_capacity | DECIMAL | Food storage capacity |
| verification_status | ENUM | Verification status |

#### C. Donations

Stores surplus-food donation information.

| Field | Type | Description |
|---|---|---|
| id | INT | Primary key |
| donor_id | INT | Foreign key referencing users |
| food_name | VARCHAR | Food name |
| food_category | VARCHAR | Food category |
| quantity | DECIMAL | Available quantity |
| preparation_time | DATETIME | Food preparation time |
| storage_condition | VARCHAR | Storage information |
| expiry_time | DATETIME | Collection or expiry deadline |
| latitude | DECIMAL | Pickup latitude |
| longitude | DECIMAL | Pickup longitude |
| status | ENUM | Donation status |
| created_at | DATETIME | Creation time |

#### D. Matches

Stores NGO matching recommendations.

| Field | Type | Description |
|---|---|---|
| id | INT | Primary key |
| donation_id | INT | Foreign key referencing donations |
| ngo_id | INT | Foreign key referencing NGOs |
| compatibility_score | DECIMAL | Matching score |
| distance | DECIMAL | Distance in kilometres |
| explanation | TEXT | Matching explanation |
| status | ENUM | PENDING, ACCEPTED, REJECTED |

#### E. Pickups

Stores food collection and delivery information.

| Field | Type | Description |
|---|---|---|
| id | INT | Primary key |
| donation_id | INT | Foreign key referencing donations |
| ngo_id | INT | Foreign key referencing NGOs |
| volunteer_id | INT | Optional foreign key referencing users |
| pickup_time | DATETIME | Scheduled pickup time |
| delivery_time | DATETIME | Delivery time |
| status | ENUM | Pickup progress |

### 7.2 Database Relationships

- One user can create many donations.
- One user with the NGO role can have one NGO profile.
- One donation can have multiple NGO match recommendations.
- One NGO can receive multiple match recommendations.
- One donation can have one accepted pickup record.
- One volunteer can be assigned multiple pickups.

### Relationship Overview

```text
USERS
  |
  |---- DONATIONS
  |        |
  |        |---- MATCHES ---- NGOs
  |        |
  |        |---- PICKUPS
  |
  |---- NGO PROFILE
  |
  |---- VOLUNTEER ASSIGNMENTS
```

Foreign keys will maintain relationships between tables. Appropriate indexes will be added for frequently searched fields.

## 8. API Architecture

The frontend communicates with the backend through REST APIs.

Base URL:

`/api`

### 8.1 Authentication APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get logged-in user |

### 8.2 Donation APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/donations | Create donation |
| GET | /api/donations | Get available donations |
| GET | /api/donations/:id | Get donation details |
| PATCH | /api/donations/:id | Update donation |
| PATCH | /api/donations/:id/cancel | Cancel donation |

### 8.3 NGO APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/ngos | Get NGOs |
| GET | /api/ngos/:id | Get NGO details |
| PATCH | /api/ngos/profile | Update NGO profile |

### 8.4 Matching APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/matches/:donationId | Get recommended NGOs |
| POST | /api/matches/:matchId/accept | Accept a match |

### 8.5 Pickup APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/pickups | Create pickup |
| GET | /api/pickups/:id | Get pickup details |
| PATCH | /api/pickups/:id/status | Update pickup status |

These are proposed endpoints and may be adjusted during implementation.

## 9. AI Matching Engine Architecture

The matching engine is one of the main features of FoodBridge AI.

Its purpose is to recommend suitable NGOs for each food donation.

For the hackathon MVP, we will use a rule-based scoring algorithm instead of training a machine-learning model.

### Matching Process

1. Receive donation information.
2. Apply food eligibility and safety checks.
3. Filter NGOs based on food-category compatibility.
4. Check NGO capacity.
5. Calculate geographical distance.
6. Evaluate collection-time feasibility.
7. Calculate matching scores.
8. Rank eligible NGOs.
9. Return recommendations with explanations.

### Proposed Matching Weights

| Matching Factor | Weight |
|---|---:|
| NGO Capacity Suitability | 30% |
| Food Category Compatibility | 25% |
| Distance | 25% |
| Collection-Time Feasibility | 20% |
| Total | 100% |

### Food Safety Rule

Food safety eligibility is a mandatory filter, not a scoring factor.

A donation that fails the configured eligibility rules must not be recommended.

The platform will collect relevant information such as preparation time, storage conditions, and expiry or collection deadline.

The matching score does not certify food safety. Appropriate food handling and inspection procedures remain necessary.

### Matching Output

Each recommendation should include:

- NGO name.
- Matching score.
- Distance.
- Capacity suitability.
- Collection-time feasibility.
- Reason for recommendation.

This makes the recommendations explainable to users.

## 10. Donation Lifecycle

Every donation moves through a defined set of statuses.

```text
AVAILABLE
    |
    v
ACCEPTED
    |
    v
ASSIGNED
    |
    v
PICKED_UP
    |
    v
COMPLETED
```

Additional statuses:

- EXPIRED: Donation has passed its deadline.
- CANCELLED: Donation has been cancelled.

Only authorised users should be allowed to update donation statuses.

## 11. Authentication and Security

### Security Measures

- JWT-based authentication.
- Password hashing using bcrypt.
- Role-based access control.
- Protected backend routes.
- Input validation.
- Secure environment variables.
- Proper error handling.
- Ownership checks before modifying donations or pickups.
- Database queries through Prisma to help prevent SQL injection.

### User Roles

**DONOR**
- Create donations.
- View their donations.
- Manage donation details.
- View matching recommendations.

**NGO**
- Manage organisation profile.
- View suitable donations.
- Accept donations.
- Coordinate collection.

**VOLUNTEER**
- View assigned pickup tasks.
- Update pickup progress.

For the MVP, NGO verification will use pre-approved demo accounts instead of a complete verification system.

## 12. Data Flow

### Donation Creation

```text
Donor
  |
  v
Donation Form
  |
  v
Frontend API Request
  |
  v
Backend Validation
  |
  v
Prisma ORM
  |
  v
MySQL Database
  |
  v
Matching Engine
  |
  v
Recommended NGOs
  |
  v
NGO Dashboard
```

### Donation Acceptance

```text
NGO
 |
 v
Select Donation
 |
 v
Accept Match
 |
 v
Backend Checks Availability
 |
 v
Database Transaction
 |
 v
Update Donation Status
 |
 v
Pickup Coordination
 |
 v
Donation Completed
```

Acceptance should use a database transaction or equivalent concurrency-safe check to prevent two NGOs from accepting the same donation.

## 13. Environment Configuration

Sensitive configuration values must be stored in environment variables.

### Backend .env Example

```env
PORT=5000
DATABASE_URL="mysql://username:password@localhost:3306/foodbridge"
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

Never commit actual secrets or `.env` files to GitHub.

An `.env.example` file should contain placeholder values.

## 14. Deployment Architecture

Proposed deployment:

- Frontend: Vercel.
- Backend: Render.
- Database: Managed MySQL hosting.
- Source code: GitHub.

The frontend communicates with the deployed backend through its API base URL.

Environment variables must be configured separately in the hosting platforms.

## 15. Hackathon MVP Scope

### Must Have

- User registration and login.
- Donor and NGO dashboards.
- Create and view food donations.
- Basic food eligibility checks.
- NGO matching and ranking.
- NGO donation acceptance.
- Donation status updates.
- MySQL database integration.

### Should Have

- Distance calculation.
- Map integration.
- Volunteer pickup coordination.
- Basic impact statistics.

### Future Enhancements

- Advanced AI recommendations.
- Automated NGO verification.
- Real-time notifications.
- Route optimisation.
- Food demand prediction.
- Advanced analytics dashboard.

## 16. Conclusion

The FoodBridge AI architecture provides a modular technical foundation for building a food rescue platform.

By combining React, Node.js, Express, MySQL, Prisma ORM, and an explainable matching engine, the application aims to simplify food donation and connect surplus food with organisations that can distribute it.

The architecture prioritises essential functionality, food eligibility, security, and practical implementation within the hackathon timeline.