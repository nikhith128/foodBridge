# FoodBridge AI
# Product Requirements Document (PRD)

**Project Name:** FoodBridge AI  
**Document:** Product Requirements Document  
**Version:** 1.0  
**Project Type:** AI-Powered Food Rescue Platform  
**Target:** College Hackathon MVP

---

## 1. Product Overview

FoodBridge AI is a web-based platform that connects food donors with nearby NGOs and food recovery organisations to reduce surplus food waste.

The platform allows donors to publish available food donations, NGOs to discover suitable donations, and volunteers to coordinate collection and delivery.

An intelligent matching engine recommends suitable NGOs based on food compatibility, receiving capacity, geographical distance and collection deadlines.

The primary goal is to make food donation easier, faster and more organised.

## 2. Problem Statement

Restaurants, hotels, college canteens, hostels and event organisers frequently have surplus food that goes unused.

At the same time, NGOs and charitable organisations require food resources to support communities.

Currently, connecting donors with suitable recipients can involve manual communication, delays and difficulty finding available organisations.

FoodBridge AI aims to address this problem through a centralised food donation platform with intelligent recipient recommendations and donation tracking.

## 3. Product Goals and Objectives

### Primary Goals

1. Connect surplus-food donors with suitable NGOs.
2. Reduce avoidable food waste.
3. Simplify the food donation process.
4. Improve coordination between donors and recipients.
5. Recommend suitable NGOs using intelligent matching.
6. Help users track donation progress.

### Secondary Goals

1. Encourage volunteer participation.
2. Provide location-based donation discovery.
3. Display food rescue impact statistics.
4. Create an attractive and accessible user experience.

## 4. Target Audience

### 4.1 Food Donors

Examples:
- Restaurants
- Hotels
- College canteens
- Hostels
- Bakeries
- Event organisers
- Catering businesses

### 4.2 NGOs and Food Recovery Organisations

Organisations that collect surplus food and distribute it to people who need it.

### 4.3 Volunteers

Individuals who help collect and deliver accepted food donations.

## 5. User Roles and Permissions

| Functionality | Donor | NGO | Volunteer |
|---|---|---|---|
| Register/Login | Yes | Yes | Yes |
| Manage profile | Yes | Yes | Yes |
| Create donation | Yes | No | No |
| View donations | Own | Available | Assigned |
| View NGO matches | Yes | No | No |
| Accept donation | No | Yes | No |
| Manage NGO capacity | No | Yes | No |
| View pickup tasks | No | No | Yes |
| Confirm collection | No | No | Yes |
| Confirm delivery | No | Yes | Yes |
| View impact statistics | Yes | Yes | Limited |

Access must be enforced on the backend, not only by hiding frontend buttons.

## 6. Functional Requirements

### FR-01: User Registration

**Description:** Users must be able to create accounts on the platform.

Requirements:
- Collect name, email and password.
- Allow selection of an appropriate user role.
- Validate registration information.
- Store passwords securely using hashing.
- Prevent duplicate email registrations.

**Acceptance Criteria:**
- Users can register successfully with valid information.
- Invalid information produces appropriate errors.
- Duplicate email addresses cannot be registered.

### FR-02: User Login

**Description:** Registered users must be able to log in.

Requirements:
- Authenticate using email and password.
- Provide role-based dashboard access.
- Handle incorrect credentials.
- Protect authenticated routes.

**Acceptance Criteria:**
- Valid users can log in.
- Invalid credentials are rejected.
- Users cannot access another role's restricted functionality.

### FR-03: Donor Dashboard

**Description:** Donors must have a dashboard to manage their food donations.

Requirements:
- Display donation statistics.
- Display active donations.
- Display accepted donations.
- Display completed donations.
- Provide an option to create new donations.

**Acceptance Criteria:**
- Donors can view their own donation records.
- Dashboard statistics reflect actual donation records.

### FR-04: Create Food Donation

**Description:** Donors must be able to publish surplus food.

Required information:
- Food name.
- Food category.
- Quantity.
- Vegetarian or non-vegetarian type.
- Preparation date and time.
- Storage information.
- Collection deadline.
- Pickup location.
- Additional description.

**Acceptance Criteria:**
- Valid donation details can be submitted.
- Required fields are validated.
- Donation records are stored in the database.
- Newly created donations appear in the donor dashboard.
- Donations with missing or invalid essential safety information are not made eligible for matching.

### FR-05: NGO Registration and Profile Management

**Description:** NGOs must be able to register and manage their organisation details.

Requirements:
- Organisation name.
- Contact information.
- Location.
- Food preferences.
- Receiving capacity.
- Availability information.

**Acceptance Criteria:**
- NGOs can create and update their profiles.
- Capacity and food preferences are stored.
- Unverified organisations are clearly distinguished from verified organisations.

### FR-06: NGO Dashboard

**Description:** NGOs must have a dashboard to discover and manage food donations.

Requirements:
- Display available donations.
- Display recommended donations.
- Display accepted donations.
- Display receiving capacity.
- Provide donation acceptance and rejection actions.

**Acceptance Criteria:**
- NGOs can view eligible available donations.
- NGOs can view donation information.
- NGOs can accept suitable donations.
- NGOs cannot accept donations that have already been accepted by another organisation.

### FR-07: AI-Based Smart Matching

**Description:** The system must recommend suitable NGOs for each food donation.

Matching factors:

| Factor | Weight |
|---|---:|
| Capacity suitability | 30% |
| Food compatibility | 25% |
| Distance | 25% |
| Collection time feasibility | 20% |

Requirements:
- Identify eligible NGOs.
- Evaluate the matching factors.
- Calculate a suitability score.
- Rank eligible NGOs.
- Explain the recommendation.

**Acceptance Criteria:**
- Ineligible NGOs are excluded.
- Suitable NGOs are ranked using the matching algorithm.
- The recommendation includes a matching score.
- The system explains why an NGO is recommended.
- Matching results are based on actual stored information.

The matching score is a decision-support mechanism, not a guarantee of successful collection.

### FR-08: Distance Calculation

**Description:** The system must calculate the geographical distance between donors and NGOs.

Requirements:
- Store latitude and longitude.
- Calculate distance between two locations.
- Display approximate distance.
- Use distance during NGO matching.

**Acceptance Criteria:**
- Distances are calculated using available coordinates.
- Missing location information is handled appropriately.
- The system does not invent geographical coordinates.

### FR-09: Food Urgency Prioritisation

**Description:** The system must identify donations that require faster collection.

Requirements:
- Consider collection deadlines.
- Calculate remaining collection time.
- Highlight urgent donations.
- Exclude donations past their eligibility deadline.

**Acceptance Criteria:**
- Urgent donations are visibly identified.
- Expired donations cannot be newly accepted.
- Time calculations use consistent server-side timestamps.

### FR-10: Donation Acceptance

**Description:** NGOs must be able to accept suitable food donations.

Requirements:
- Display donation details.
- Allow acceptance or rejection.
- Update donation status.
- Prevent duplicate acceptance.
- Record the accepting NGO.

**Acceptance Criteria:**
- Accepted donations are no longer available to other NGOs.
- Donation status is updated correctly.
- Acceptance information is stored in the database.

### FR-11: Pickup and Delivery Tracking

**Description:** The platform must support basic food collection coordination.

Requirements:
- Assign a volunteer to an accepted donation.
- Display pickup location.
- Display delivery destination.
- Allow pickup confirmation.
- Allow delivery confirmation.

**Acceptance Criteria:**
- Pickup assignments are associated with the correct donation.
- Only authorised users can update pickup status.
- Collection and delivery completion are recorded.

### FR-12: Impact Dashboard

**Description:** The platform must display food rescue statistics.

Requirements:
- Total completed donations.
- Estimated meals rescued.
- Active donations.
- Completed pickups.
- Participating organisations.

**Acceptance Criteria:**
- Statistics are calculated from actual donation records.
- Only completed donations contribute to completed donation statistics.
- Sample data is clearly identified during demonstrations.

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Pages should load efficiently.
- API responses should be reasonably fast.
- Large donation lists should support pagination when necessary.

### 7.2 Security
- Passwords must be hashed.
- Protected routes must require authentication.
- Role-based access must be enforced.
- Inputs must be validated.
- API secrets must be stored in environment variables.

### 7.3 Usability
- Interface should be simple and intuitive.
- Users should easily understand donation status.
- Forms should provide clear validation messages.
- Navigation should be consistent.

### 7.4 Responsiveness
- Application should work on desktop, tablet and mobile.
- Dashboards and forms should adapt to different screen sizes.

### 7.5 Reliability
- Errors should be handled gracefully.
- Database operations should preserve data consistency.
- Duplicate donation acceptance must be prevented.

### 7.6 Maintainability
- Frontend and backend should be organised separately.
- Components and modules should be reusable.
- API naming should be consistent.

## 8. Feature Prioritisation

Features are classified according to their importance for the hackathon MVP.

### Must Have (P0)

These features are essential for the demonstration.

- User registration and login.
- Donor dashboard.
- NGO dashboard.
- Create food donation.
- NGO profile and capacity management.
- Intelligent matching algorithm.
- Distance calculation.
- Donation acceptance.
- Donation status tracking.
- Basic impact statistics.

### Should Have (P1)

Implement if time permits.

- Interactive donation map.
- Urgency notifications.
- Volunteer assignment.
- Pickup confirmation using OTP.
- Donation history.
- Responsive dashboard analytics.

### Could Have (P2)

Future improvements.

- AI food image classification.
- Multilingual voice input.
- Advanced route optimisation.
- WhatsApp integration.
- Predictive food demand analysis.
- Advanced real-time notifications.

## 9. User Stories

### Food Donor

- As a donor, I want to register so I can publish food donations.
- As a donor, I want to enter food details so NGOs can understand what is available.
- As a donor, I want to receive suitable NGO recommendations.
- As a donor, I want to track donation progress.

### NGO

- As an NGO, I want to register my organisation.
- As an NGO, I want to specify my food preferences and capacity.
- As an NGO, I want to discover available food donations.
- As an NGO, I want to accept suitable donations.
- As an NGO, I want to confirm food receipt.

### Volunteer

- As a volunteer, I want to view assigned pickups.
- As a volunteer, I want to access collection information.
- As a volunteer, I want to confirm food collection and delivery.

## 10. Donation Status Lifecycle

A donation must follow a controlled lifecycle.

1. AVAILABLE – Donation has been published.
2. ACCEPTED – An NGO has accepted the donation.
3. ASSIGNED – A volunteer has been assigned.
4. PICKED_UP – Food has been collected.
5. COMPLETED – Delivery has been confirmed.

Additional states:
- EXPIRED – Collection deadline has passed.
- CANCELLED – Donation has been cancelled.

Status transitions must be validated by the backend.

## 11. Success Criteria

The MVP will be successful when:

1. Donors can register and publish donations.
2. NGOs can register and manage their profiles.
3. The system can recommend suitable NGOs.
4. Matching scores and explanations are displayed.
5. NGOs can accept donations.
6. Donation status can be tracked.
7. Completed donations update impact statistics.
8. The application works across desktop and mobile.
9. The complete donation workflow can be demonstrated successfully.

## 12. Out-of-Scope Features

The following are excluded from the initial hackathon version:

- Native Android and iOS applications.
- Payment processing.
- Custom machine-learning model training.
- Full-scale logistics management.
- Advanced route optimisation.
- Automatic food safety certification.
- Government or third-party organisation integrations.
- Production-scale deployment infrastructure.

## 13. Assumptions and Constraints

### Assumptions
- Donors provide accurate food information.
- NGOs maintain updated capacity and preferences.
- Volunteers are available when required.
- Users provide valid location information.
- Sample accounts and records can be used for demonstrations.

### Constraints
- Development time is limited to 12–24 hours.
- Team size is limited to 1–2 members.
- The project will initially be a web application.
- Third-party services and APIs should be kept to a minimum.
- The matching engine will initially use a deterministic scoring algorithm.

### Food Safety Constraint
Food safety eligibility must be checked independently of the matching score. The application must not claim that food is safe merely because it passes an automated matching process.

---

## 14. Final Product Vision

FoodBridge AI aims to create a connected food rescue ecosystem where surplus food can be discovered, matched and distributed more efficiently.

By combining intelligent recommendations, location-based discovery and donation tracking, the platform aims to reduce avoidable food waste and support communities.

**FoodBridge AI – Rescue Food. Connect Communities. Reduce Waste.**