import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  Clock,
  Inbox,
  Info,
  MoreVertical,
  Package,
  ShieldCheck,
  Trash2,
  Truck,
} from 'lucide-react';

import { Badge, Button, Card, EmptyState, Tabs, useToast } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
} from '../../data/notifications.js';
import { cn } from '../../utils/cn.js';

/**
 * Notifications — page 27 (Design.md section 10).
 *
 * There is no Stitch screen for this page and no backend notification table or
 * endpoint, so the list is labelled sample data. The page itself is real: the
 * tabs, grouping (Today / Yesterday / Earlier), per-item menu, mark-as-read and
 * delete all work, and each item links to the page that owns the record.
 * Read and deleted state is session-only (src/data/notifications.js), which is
 * the honest shape for an MVP with no push delivery.
 */

const CATEGORY = {
  DONATIONS: { label: 'Donations', icon: Package },
  PICKUPS: { label: 'Pickups', icon: Truck },
  SYSTEM: { label: 'System', icon: ShieldCheck },
};

const GROUPS = [
  { key: 'TODAY', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: 'EARLIER', label: 'Earlier' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** TODAY / YESTERDAY / EARLIER from a timestamp, using local calendar days. */
function groupFor(value, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'EARLIER';

  const difference = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (difference <= 0) return 'TODAY';
  if (difference === 1) return 'YESTERDAY';
  return 'EARLIER';
}

/** "Just now", "12 min ago", "3 hr ago", "2 days ago". */
function timeAgo(value, now = Date.now()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const minutes = Math.max(0, Math.round((now - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export default function Notifications() {
  const { user } = useAuth();
  const { success } = useToast();

  const notifications = useNotifications(user?.role);
  const [tab, setTab] = useState('ALL');
  const [openMenuId, setOpenMenuId] = useState(null);

  // A click anywhere else closes the open row menu.
  useEffect(() => {
    if (!openMenuId) return undefined;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const filtered = useMemo(() => {
    if (tab === 'UNREAD') return notifications.filter((item) => !item.read);
    if (tab === 'ALL') return notifications;
    return notifications.filter((item) => item.category === tab);
  }, [notifications, tab]);

  const grouped = useMemo(() => {
    const buckets = { TODAY: [], YESTERDAY: [], EARLIER: [] };
    filtered.forEach((item) => buckets[groupFor(item.createdAt)].push(item));
    return buckets;
  }, [filtered]);

  const tabs = [
    { value: 'ALL', label: 'All', count: notifications.length },
    { value: 'UNREAD', label: 'Unread', count: unreadCount },
    { value: 'DONATIONS', label: 'Donations' },
    { value: 'PICKUPS', label: 'Pickups' },
    { value: 'SYSTEM', label: 'System' },
  ];

  const markAllRead = () => {
    markAllNotificationsRead(user?.role);
    success('All notifications marked as read.');
  };

  const markRead = (item) => {
    markNotificationRead(item.id);
    setOpenMenuId(null);
    success(`“${item.title}” marked as read.`);
  };

  const dismiss = (item) => {
    deleteNotification(item.id);
    setOpenMenuId(null);
    success('Notification dismissed.');
  };

  const emptyCopy =
    tab === 'UNREAD'
      ? {
          title: 'No unread notifications',
          message: 'You have read every notification in this sample list.',
        }
      : tab === 'ALL'
        ? {
            title: 'Nothing here yet',
            message: 'New donation, pickup and system updates will appear in this list.',
          }
        : {
            title: `No ${CATEGORY[tab]?.label.toLowerCase()} notifications`,
            message: 'There are no notifications in this category right now.',
          };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            Shared
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Notifications
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Donation, pickup and system updates in one list. Open an item to go straight to the
            record it mentions.
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" size="sm" icon={Info}>
              Sample data for demonstration
            </Badge>
            <span className="font-label-sm text-label-sm text-outline">
              In-app list only — no push or email delivery in this MVP.
            </span>
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="shrink-0"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Mark all as read
        </Button>
      </header>

      {/* --- Tabs --------------------------------------------------------- */}
      <Tabs items={tabs} value={tab} onChange={setTab} ariaLabel="Notification filters" />

      {/* --- List --------------------------------------------------------- */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={tab === 'UNREAD' ? Check : Bell}
          title={emptyCopy.title}
          message={emptyCopy.message}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {GROUPS.map((group) => {
            const items = grouped[group.key];
            if (items.length === 0) return null;

            return (
              <section key={group.key} aria-label={group.label}>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    {group.label}
                  </h2>
                  <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm font-semibold text-on-surface-variant">
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {items.map((item) => {
                    const meta = CATEGORY[item.category] || CATEGORY.SYSTEM;
                    const ItemIcon = meta.icon;

                    return (
                      <Card
                        key={item.id}
                        padding="none"
                        className={cn(
                          'transition-colors',
                          !item.read && 'border-l-4 border-l-primary bg-mint/20'
                        )}
                      >
                        <div className="flex items-start gap-3 p-4 sm:p-5">
                          <span
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                              !item.read
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-surface-container text-on-surface-variant'
                            )}
                          >
                            <ItemIcon className="h-5 w-5" aria-hidden="true" />
                          </span>

                          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                            <Link
                              to={item.to}
                              className="group min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                            >
                              <span className="flex items-start gap-2">
                                <span className="font-title-md text-title-md font-semibold text-on-surface group-hover:text-primary group-hover:underline">
                                  {item.title}
                                </span>
                                {!item.read && (
                                  <span
                                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                                    aria-label="Unread"
                                  />
                                )}
                              </span>
                              <span className="mt-0.5 block font-body-sm text-body-sm text-on-surface-variant">
                                {item.message}
                              </span>
                              <span className="mt-1.5 flex flex-wrap items-center gap-2 font-label-sm text-label-sm text-outline">
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                {timeAgo(item.createdAt)}
                                <span aria-hidden="true">·</span>
                                {meta.label}
                              </span>
                            </Link>

                            <div className="relative shrink-0">
                              <button
                                type="button"
                                aria-label={`Actions for ${item.title}`}
                                aria-haspopup="menu"
                                aria-expanded={openMenuId === item.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenMenuId(openMenuId === item.id ? null : item.id);
                                }}
                                className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                              >
                                <MoreVertical className="h-5 w-5" aria-hidden="true" />
                              </button>

                              {openMenuId === item.id && (
                                <div
                                  role="menu"
                                  aria-label={`Actions for ${item.title}`}
                                  className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest py-1 shadow-overlay"
                                >
                                  {!item.read && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => markRead(item)}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left font-body-sm text-body-sm text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:bg-surface-container"
                                    >
                                      <Check className="h-4 w-4" aria-hidden="true" />
                                      Mark as read
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => dismiss(item)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left font-body-sm text-body-sm text-error transition-colors hover:bg-error-container focus-visible:outline-none focus-visible:bg-error-container"
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-2 font-label-sm text-label-sm text-outline">
        <Inbox className="h-4 w-4" aria-hidden="true" />
        Read and dismissed items are kept for this session only and return when you reload.
      </p>
    </div>
  );
}
