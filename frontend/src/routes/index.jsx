import { Route, Routes } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute.jsx';
import PublicOnlyRoute from './PublicOnlyRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import Home from '../pages/public/Home.jsx';
import Login from '../pages/public/Login.jsx';
import Register from '../pages/public/Register.jsx';
import About from '../pages/public/About.jsx';
import HowItWorks from '../pages/public/HowItWorks.jsx';
import ForgotPassword from '../pages/public/ForgotPassword.jsx';

import CreateDonation from '../pages/donor/CreateDonation.jsx';
import DonationsList from '../pages/donor/DonationsList.jsx';
import DonorDashboard from '../pages/donor/DonorDashboard.jsx';
import DonorDonationDetails from '../pages/donor/DonationDetails.jsx';
import MatchingResults from '../pages/donor/MatchingResults.jsx';
import PickupDetails from '../pages/donor/PickupDetails.jsx';

import AcceptedDonations from '../pages/ngo/AcceptedDonations.jsx';
import AvailableDonations from '../pages/ngo/AvailableDonations.jsx';
import DonationDetails from '../pages/ngo/DonationDetails.jsx';
import NgoDashboard from '../pages/ngo/NgoDashboard.jsx';
import PickupManagement from '../pages/ngo/PickupManagement.jsx';
import MatchingRecommendations from '../pages/ngo/MatchingRecommendations.jsx';
import DonationHistory from '../pages/ngo/DonationHistory.jsx';

import ImpactDashboard from '../pages/impact/ImpactDashboard.jsx';
import Profile from '../pages/system/Profile.jsx';
import ProfileEdit from '../pages/system/ProfileEdit.jsx';
import Settings from '../pages/system/Settings.jsx';
import Notifications from '../pages/system/Notifications.jsx';
import NotFound from '../pages/system/NotFound.jsx';
import VolunteerDashboard from '../pages/volunteer/VolunteerDashboard.jsx';
import AvailableTasks from '../pages/volunteer/AvailableTasks.jsx';
import MyTasks from '../pages/volunteer/MyTasks.jsx';
import TaskDetails from '../pages/volunteer/TaskDetails.jsx';
import ComponentGallery from '../pages/dev/ComponentGallery.jsx';
import TokenPreview from '../pages/TokenPreview.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      {/* --- Public ------------------------------------------------------- */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />

        {/* Sign-in and sign-up are hidden from anyone already signed in. */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
      </Route>

      {/* --- Role dashboards (any session, then a specific role) ---------- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute role="DONOR" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/donor" element={<DonorDashboard />} />
            <Route path="/donor/create-donation" element={<CreateDonation />} />
            <Route path="/donor/donations/new" element={<CreateDonation />} />
            <Route path="/donor/donations" element={<DonationsList />} />
            <Route path="/donor/donations/:id" element={<DonorDonationDetails />} />
            <Route path="/donor/donations/:id/matches" element={<MatchingResults />} />
            <Route path="/donor/matches" element={<MatchingResults />} />
            <Route path="/donor/pickups" element={<PickupDetails />} />
            <Route path="/donor/pickups/:id" element={<PickupDetails />} />
          </Route>
        </Route>

        <Route element={<RoleRoute role="NGO" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/ngo" element={<NgoDashboard />} />
            <Route path="/ngo/donations" element={<AvailableDonations />} />
            <Route path="/ngo/donations/:id" element={<DonationDetails />} />
            <Route path="/ngo/recommendations" element={<MatchingRecommendations />} />
            <Route path="/ngo/accepted" element={<AcceptedDonations />} />
            <Route path="/ngo/pickups" element={<PickupManagement />} />
            <Route path="/ngo/history" element={<DonationHistory />} />
          </Route>
        </Route>

        <Route element={<RoleRoute role="VOLUNTEER" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/volunteer" element={<VolunteerDashboard />} />
            <Route path="/volunteer/tasks" element={<AvailableTasks />} />
            <Route path="/volunteer/my-tasks" element={<MyTasks />} />
            <Route path="/volunteer/tasks/:id" element={<TaskDetails />} />
          </Route>
        </Route>

        {/* Shared portal pages (Impact, Notifications, Profile, Settings) */}
        <Route element={<DashboardLayout />}>
          <Route path="/impact" element={<ImpactDashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/settings" element={<Settings />} />
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
