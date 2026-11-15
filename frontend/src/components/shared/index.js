/**
 * Shared component barrel.
 *
 * Import from the folder, not the file:
 *   import { StatCard, RouteLoader } from '../components/shared';
 *
 * The rest of the Design.md section 4 list (DonationCard, MatchCard, TaskCard,
 * DataTable, MapCard) arrives with the pages that use them in Steps C-E.
 */

export { default as RouteLoader } from './RouteLoader.jsx';
export { default as Logo } from './Logo.jsx';
export { default as StatCard } from './StatCard.jsx';
export { default as NotificationItem } from './NotificationItem.jsx';
