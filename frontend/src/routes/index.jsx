import { Route, Routes } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute.jsx';
import PublicOnlyRoute from './PublicOnlyRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import Home from '../pages/public/Home.jsx';
import Login from '../pages/public/Login.jsx';
import Register from '../pages/public/Register.jsx';
import CreateDonation from '../pages/donor/CreateDonation.jsx';
import DonorDashboard from '../pages/donor/DonorDashboard.jsx';
import MatchingResults from '../pages/donor/MatchingResults.jsx';
import AvailableDonations from '../pages/ngo/AvailableDonations.jsx';
import DonationDetails from '../pages/ngo/DonationDetails.jsx';
import NgoDashboard from '../pages/ngo/NgoDashboard.jsx';
import PickupManagement from '../pages/ngo/PickupManagement.jsx';
import ImpactDashboard from '../pages/impact/ImpactDashboard.jsx';
import NotFound from '../pages/system/NotFound.jsx';
import RoleHome from '../pages/system/RoleHome.jsx';
import ComponentGallery from '../pages/dev/ComponentGallery.jsx';
import TokenPreview from '../pages/TokenPreview.jsx';

/**
 * The route table.
 *
 * Scope (Step B3 decision): only the routes being built now — Home, Register,
 * Login, the three role dashboards, and the 404. The deferred pages from
 * Design.md section 9 are added as they are built, not declared empty here.
 *
 * Layouts (Step B4) are pathless parents so each route inherits its chrome:
 *   PublicLayout    the signed-out header + footer
 *   ProtectedRoute  any session, then RoleRoute pins the role
 *   PublicOnlyRoute the inverse of ProtectedRoute — auth pages bounce a
 *                   signed-in visitor to their own dashboard
 *
 * The development routes stay until Step F, when ComponentGallery and
 * TokenPreview are deleted.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* --- Public ------------------------------------------------------- */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />

        {/* Sign-in and sign-up are hidden from anyone already signed in. */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Route>
      </Route>

      {/* --- Role dashboards (any session, then a specific role) ---------- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute role="DONOR" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/donor" element={<DonorDashboard />} />
            <Route path="/donor/donations/new" element={<CreateDonation />} />
            <Route path="/donor/donations/:id/matches" element={<MatchingResults />} />
          </Route>
        </Route>

        <Route element={<RoleRoute role="NGO" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/ngo" element={<NgoDashboard />} />
            <Route path="/ngo/donations" element={<AvailableDonations />} />
            <Route path="/ngo/donations/:id" element={<DonationDetails />} />
            <Route path="/ngo/pickups" element={<PickupManagement />} />
          </Route>
        </Route>

        <Route element={<RoleRoute role="VOLUNTEER" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/volunteer" element={<RoleHome />} />
          </Route>
        </Route>

        {/* Impact is the one dashboard every role shares (Design.md section 9),
            so it sits outside the per-role groups and reads its scope from the
            session inside the page. */}
        <Route element={<DashboardLayout />}>
          <Route path="/impact" element={<ImpactDashboard />} />
        </Route>
      </Route>

      {/* --- Development only (deleted before Step F) --------------------- */}
      <Route path="/dev/components" element={<ComponentGallery />} />
      <Route path="/dev/tokens" element={<TokenPreview />} />

      {/* --- Anything else ------------------------------------------------ */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
