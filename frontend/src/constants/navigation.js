import {
  Bell,
  ClipboardCheck,
  ClipboardList,
  History,
  Inbox,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Network,
  Package,
  PlusCircle,
  Settings,
  Sparkles,
  Truck,
  UserCircle,
} from 'lucide-react';

/**
 * Navigation data for the two layouts.
 *
 * Source of truth for the item lists is Design.md section 8 ("Role sidebars").
 * The screens carry the same items but each screen only highlights its own, so
 * the complete list is assembled here once rather than scraped from ten files.
 *
 * `built` is the honest state of the app: only the dashboard route exists until
 * Steps C-E build the rest. The sidebar renders an unbuilt item as a
 * non-clickable row with a "Soon" pill (Step B4 decision) instead of a link
 * that 404s. Flip the flag as each page lands.
 */

// --- Public site (PublicLayout) --------------------------------------------
// The Stitch landing screen shows Home, About Us and How It Works. About Us and
// How It Works are on the Phases.md "Later" list, so they are marked unbuilt and
// rendered as inert text for now.
export const PUBLIC_NAV = [
  { key: 'home', label: 'Home', to: '/', built: true, end: true },
  { key: 'about', label: 'About Us', to: '/about', built: false },
  { key: 'how', label: 'How It Works', to: '/how-it-works', built: false },
];

export const PUBLIC_ACCOUNT_LINKS = [
  { key: 'login', label: 'Login', to: '/login', built: true },
  { key: 'register', label: 'Register', to: '/register', built: true },
  { key: 'donor', label: 'Donor Portal', to: '/donor', built: true },
];

// --- Signed-in roles (DashboardLayout) -------------------------------------
export const NAV_ITEMS = {
  DONOR: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/donor', built: true, exact: true },
    { key: 'create', label: 'Create Donation', icon: PlusCircle, to: '/donor/donations/new', built: true },
    { key: 'donations', label: 'My Donations', icon: Package, to: '/donor/donations', built: true },
    { key: 'matches', label: 'Matching Results', icon: Network, to: '/donor/matches', built: true },
    { key: 'pickups', label: 'Pickup Details', icon: Truck, to: '/donor/pickups', built: true },
    { key: 'impact', label: 'Impact Dashboard', icon: LineChart, to: '/impact', built: true },
    { key: 'notifications', label: 'Notifications', icon: Bell, to: '/notifications', built: true },
    { key: 'profile', label: 'Profile', icon: UserCircle, to: '/profile', built: true },
    { key: 'settings', label: 'Settings', icon: Settings, to: '/settings', built: true },
  ],
  NGO: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/ngo', built: true, exact: true },
    { key: 'available', label: 'Available Donations', icon: Inbox, to: '/ngo/donations', built: true },
    { key: 'recommendations', label: 'Matching Recommendations', icon: Sparkles, to: '/ngo/recommendations', built: true },
    { key: 'accepted', label: 'My Accepted Donations', icon: ClipboardCheck, to: '/ngo/accepted', built: true },
    { key: 'pickups', label: 'Pickup Management', icon: Truck, to: '/ngo/pickups', built: true },
    { key: 'history', label: 'Donation History', icon: History, to: '/ngo/history', built: true },
    { key: 'impact', label: 'Impact Dashboard', icon: LineChart, to: '/impact', built: true },
    { key: 'notifications', label: 'Notifications', icon: Bell, to: '/notifications', built: true },
    { key: 'profile', label: 'Profile', icon: UserCircle, to: '/profile', built: true },
    { key: 'settings', label: 'Settings', icon: Settings, to: '/settings', built: true },
  ],
  VOLUNTEER: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/volunteer', built: true, exact: true },
    { key: 'available', label: 'Available Tasks', icon: ListChecks, to: '/volunteer/tasks', built: true },
    { key: 'mine', label: 'My Tasks', icon: ClipboardList, to: '/volunteer/my-tasks', built: true },
    { key: 'impact', label: 'Impact Dashboard', icon: LineChart, to: '/impact', built: true },
    { key: 'notifications', label: 'Notifications', icon: Bell, to: '/notifications', built: true, badge: true },
    { key: 'profile', label: 'Profile', icon: UserCircle, to: '/profile', built: true },
    { key: 'settings', label: 'Settings', icon: Settings, to: '/settings', built: true },
  ],
};

/**
 * The volunteer mobile tab bar, from the only screen that shows a bottom nav
 * (page 14: Dashboard, Tasks, Alerts, Profile). Step B4 decision: volunteer only
 * — donor and NGO mobile use the drawer alone.
 */
export const VOLUNTEER_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/volunteer', built: true, exact: true },
  { key: 'tasks', label: 'Tasks', icon: Truck, to: '/volunteer/tasks', built: false },
  { key: 'alerts', label: 'Alerts', icon: Bell, to: '/notifications', built: false, badge: true },
  { key: 'profile', label: 'Profile', icon: UserCircle, to: '/profile', built: false },
];

/** Human labels for the role, used by the sidebar footer and the top bar. */
export const ROLE_LABELS = {
  DONOR: 'Donor',
  NGO: 'NGO',
  VOLUNTEER: 'Volunteer',
};

/** The subtitle under the wordmark on the portal-style sidebar. */
export const ROLE_PORTAL_LABEL = {
  DONOR: 'Donor Portal',
  NGO: 'NGO Portal',
  VOLUNTEER: 'Volunteer Portal',
};

/** The nav list for a role, or an empty list for an unknown one. */
export function navigationForRole(role) {
  return NAV_ITEMS[role] || [];
}
