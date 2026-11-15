import { useMemo, useSyncExternalStore } from 'react';

/**
 * Sample in-app notifications.
 *
 * Architecture.md and the backend expose no notification table or endpoint:
 * auth.routes.js only has register / login / me. Design.md section 10 therefore
 * specifies a "simple in-app list only (no real-time push in the MVP)", and
 * section 12 allows sample data provided it is labelled "Sample data".
 *
 * The records below reuse the seeded demo organisations and batch ids so the
 * page agrees with the donor and NGO portals. Nothing here claims to have been
 * delivered by a server: the page carries the sample label, and read/delete
 * state lives in this module for the session only, so a reload restores the
 * starting list.
 *
 * Categories map exactly onto the page's tabs: DONATIONS, PICKUPS, SYSTEM.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** An ISO timestamp `offset` milliseconds in the past. */
function ago(offset) {
  return new Date(Date.now() - offset).toISOString();
}

/**
 * The immutable starting list. `read` is the state a fresh session begins in;
 * the store below layers per-session read/delete changes on top without
 * mutating this array.
 */
const INITIAL_NOTIFICATIONS = [
  // --- Donor ---------------------------------------------------------------
  {
    id: 'donor-match-79',
    role: 'DONOR',
    category: 'DONATIONS',
    title: 'Donation matched',
    message:
      'Batch #79 has recommended NGOs ready to review. Open the ranked matches to see their compatibility scores.',
    createdAt: ago(12 * MINUTE),
    read: false,
    to: '/donor/donations/79/matches',
  },
  {
    id: 'donor-pickup-80',
    role: 'DONOR',
    category: 'PICKUPS',
    title: 'Pickup scheduled',
    message:
      'Hope Foundation (Demo) accepted batch #80. The collection is now being coordinated on the pickup page.',
    createdAt: ago(2 * HOUR),
    read: false,
    to: '/donor/pickups',
  },
  {
    id: 'donor-complete-83',
    role: 'DONOR',
    category: 'PICKUPS',
    title: 'Rescue completed',
    message:
      'Batch #83 reached the receiving kitchen. Its meals now count on the Impact Dashboard.',
    createdAt: ago(26 * HOUR),
    read: true,
    to: '/donor/donations/83',
  },
  {
    id: 'donor-expiry-84',
    role: 'DONOR',
    category: 'DONATIONS',
    title: 'Batch still available',
    message:
      'Batch #84 has not been claimed yet. You can review or withdraw it from its details page.',
    createdAt: ago(2 * DAY),
    read: true,
    to: '/donor/donations/84',
  },
  {
    id: 'donor-welcome',
    role: 'DONOR',
    category: 'SYSTEM',
    title: 'How matching works',
    message:
      'Match scores combine capacity, food compatibility, distance and collection time. Read the weighting before your next batch.',
    createdAt: ago(3 * DAY),
    read: true,
    to: '/how-it-works',
  },

  // --- NGO -----------------------------------------------------------------
  {
    id: 'ngo-new-79',
    role: 'NGO',
    category: 'DONATIONS',
    title: 'New donation near you',
    message:
      'Batch #79 is available. It appears in your recommendations with a compatibility score and distance.',
    createdAt: ago(8 * MINUTE),
    read: false,
    to: '/ngo/donations/79',
  },
  {
    id: 'ngo-new-78',
    role: 'NGO',
    category: 'DONATIONS',
    title: 'New donation near you',
    message:
      'Batch #78 was published and is waiting for an NGO to accept it. Matching does not certify food safety.',
    createdAt: ago(45 * MINUTE),
    read: false,
    to: '/ngo/donations/78',
  },
  {
    id: 'ngo-ready-80',
    role: 'NGO',
    category: 'PICKUPS',
    title: 'Pickup ready',
    message:
      'Batch #80 has a scheduled collection. Keep its pickup status up to date so the donor can follow it.',
    createdAt: ago(5 * HOUR),
    read: false,
    to: '/ngo/pickups',
  },
  {
    id: 'ngo-complete-83',
    role: 'NGO',
    category: 'PICKUPS',
    title: 'Collection completed',
    message:
      'Batch #83 is filed under Donation History and is included in Our Impact.',
    createdAt: ago(27 * HOUR),
    read: true,
    to: '/ngo/history',
  },
  {
    id: 'ngo-verify',
    role: 'NGO',
    category: 'SYSTEM',
    title: 'Your organisation profile',
    message:
      'Your verification status is shown on My Profile. Keep the address and storage capacity current.',
    createdAt: ago(4 * DAY),
    read: true,
    to: '/profile',
  },

  // --- Volunteer -----------------------------------------------------------
  {
    id: 'vol-task-1042',
    role: 'VOLUNTEER',
    category: 'PICKUPS',
    title: 'New task near you',
    message:
      'VOL-1042 · Cooked Rice & Dal (Demo) is 3.1 km away and open to claim on Available Tasks.',
    createdAt: ago(6 * MINUTE),
    read: false,
    to: '/volunteer/tasks/vol-1042',
  },
  {
    id: 'vol-task-1044',
    role: 'VOLUNTEER',
    category: 'PICKUPS',
    title: 'Task closing soon',
    message:
      'VOL-1044 · Fresh Paneer Wraps (Demo) has the nearest deadline of the open sample tasks.',
    createdAt: ago(40 * MINUTE),
    read: false,
    to: '/volunteer/tasks/vol-1044',
  },
  {
    id: 'vol-task-1039',
    role: 'VOLUNTEER',
    category: 'PICKUPS',
    title: 'Task on your list',
    message:
      'VOL-1039 · Hyderabadi Dum Biryani (Demo) is claimed. Its collection code is on My Tasks.',
    createdAt: ago(3 * HOUR),
    read: false,
    to: '/volunteer/my-tasks',
  },
  {
    id: 'vol-task-1031',
    role: 'VOLUNTEER',
    category: 'PICKUPS',
    title: 'Delivery confirmed',
    message:
      'VOL-1031 was completed in this session, so the sample totals on My Tasks were updated.',
    createdAt: ago(30 * HOUR),
    read: true,
    to: '/volunteer/my-tasks',
  },
  {
    id: 'vol-sample',
    role: 'VOLUNTEER',
    category: 'SYSTEM',
    title: 'Sample dispatch data',
    message:
      'Volunteer tasks in this MVP are sample data. Claimed, picked-up and completed states reset when you reload.',
    createdAt: ago(2 * DAY),
    read: true,
    to: '/volunteer/tasks',
  },
];

/** Only the notifications addressed to one role, in newest-first order. */
export function notificationsForRole(role) {
  return INITIAL_NOTIFICATIONS.filter((notification) => notification.role === role).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

// ---------------------------------------------------------------------------
// Session store
// ---------------------------------------------------------------------------

const readIds = new Set();
const deletedIds = new Set();
const listeners = new Set();

let snapshot = { readIds: new Set(), deletedIds: new Set() };

function publish() {
  snapshot = { readIds: new Set(readIds), deletedIds: new Set(deletedIds) };
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

/** Read the session's read/delete sets from any component. */
export function useNotificationState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * The role's notifications with the session's read/delete changes applied.
 * Returns a plain array, newest first, so the page can group it.
 */
export function useNotifications(role) {
  const state = useNotificationState();

  return useMemo(
    () =>
      notificationsForRole(role)
        .filter((notification) => !state.deletedIds.has(notification.id))
        .map((notification) => ({
          ...notification,
          read: notification.read || state.readIds.has(notification.id),
        })),
    [role, state]
  );
}

export function markNotificationRead(id) {
  if (readIds.has(id)) return;
  readIds.add(id);
  publish();
}

/** Marks every notification owned by `role` as read. */
export function markAllNotificationsRead(role) {
  let changed = false;

  notificationsForRole(role).forEach((notification) => {
    if (notification.read || deletedIds.has(notification.id) || readIds.has(notification.id)) return;
    readIds.add(notification.id);
    changed = true;
  });

  if (changed) publish();
}

export function deleteNotification(id) {
  if (deletedIds.has(id)) return;
  deletedIds.add(id);
  publish();
}
