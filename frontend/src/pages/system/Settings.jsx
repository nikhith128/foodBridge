import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Building2,
  Check,
  Info,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  User,
} from 'lucide-react';

import {
  Badge,
  Banner,
  Button,
  Card,
  Input,
  Modal,
  Tabs,
  Toggle,
  useToast,
} from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PASSWORD_HINT } from '../../constants/options.js';
import { ROLE_LABELS } from '../../constants/navigation.js';
import { cn } from '../../utils/cn.js';

/**
 * Settings — page 28 (Design.md section 10).
 *
 * There is no Stitch screen and no settings endpoint: auth.routes.js only
 * supports register / login / me. Every control on this page is therefore
 * honest about what it can do today:
 *
 *   Account        merges into AuthContext for the session (updateUser).
 *   Security       validates and scores the new password, then says the
 *                  password-change endpoint does not exist yet. It never shows
 *                  a fake success.
 *   Notifications  keeps role-based preferences in this session and says push
 *                  and email delivery are not connected.
 *   Danger Zone    gates on typing DELETE, then explains that account deletion
 *                  is not available in the MVP instead of pretending to delete.
 *
 * The tabs reuse the shared Tabs component, and the switches reuse Toggle.
 */

const NOTIFICATION_OPTIONS = {
  DONOR: [
    {
      key: 'donations',
      label: 'Donation updates',
      description: 'Matching progress, expiry reminders and withdrawals for your own batches.',
    },
    {
      key: 'pickups',
      label: 'Pickup status updates',
      description: 'When an NGO accepts a batch and the collection advances.',
    },
    {
      key: 'system',
      label: 'System announcements',
      description: 'Platform notices and account messages.',
    },
  ],
  NGO: [
    {
      key: 'donations',
      label: 'New donations near me',
      description: 'Fresh batches that fit your capacity and food preferences.',
    },
    {
      key: 'pickups',
      label: 'Pickup status updates',
      description: 'Collection reminders and delivery confirmations for accepted batches.',
    },
    {
      key: 'system',
      label: 'Verification & system announcements',
      description: 'Verification changes and platform notices.',
    },
  ],
  VOLUNTEER: [
    {
      key: 'donations',
      label: 'New tasks near me',
      description: 'Sample dispatch tasks published close to your city.',
    },
    {
      key: 'pickups',
      label: 'Task deadline reminders',
      description: 'Reminders before a claimed task closes or is due for delivery.',
    },
    {
      key: 'system',
      label: 'System announcements',
      description: 'Platform notices and account messages.',
    },
  ],
};

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  {
    key: 'case',
    label: 'Upper and lower case letters',
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  { key: 'number', label: 'At least one number', test: (value) => /\d/.test(value) },
  {
    key: 'symbol',
    label: 'At least one symbol (optional, but stronger)',
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

const STRENGTH = [
  { label: 'Too weak', colour: 'bg-error', width: 'w-0' },
  { label: 'Weak', colour: 'bg-error', width: 'w-1/4' },
  { label: 'Fair', colour: 'bg-tertiary-fixed-dim', width: 'w-1/2' },
  { label: 'Good', colour: 'bg-secondary', width: 'w-3/4' },
  { label: 'Strong', colour: 'bg-primary', width: 'w-full' },
];

function strengthOf(password) {
  return PASSWORD_RULES.filter((rule) => rule.test(password)).length;
}

function phoneError(phone) {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  if (!/^[+()\d\s-]+$/.test(trimmed)) {
    return 'Use digits, spaces, +, - or parentheses only.';
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return 'Enter between 7 and 15 digits.';
  return null;
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { success, warning, error: raiseError } = useToast();

  const role = user?.role;
  const isVolunteer = role === 'VOLUNTEER';
  const notificationOptions = NOTIFICATION_OPTIONS[role] || NOTIFICATION_OPTIONS.DONOR;

  const [activeTab, setActiveTab] = useState('account');

  const [account, setAccount] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    organizationName: user?.organizationName || user?.ngo?.organizationName || '',
  });
  const [accountErrors, setAccountErrors] = useState({});

  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const [prefs, setPrefs] = useState(() =>
    Object.fromEntries(notificationOptions.map((option) => [option.key, true]))
  );

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const tabs = useMemo(
    () => [
      { value: 'account', label: 'Account', icon: User },
      { value: 'security', label: 'Security', icon: Lock },
      { value: 'notifications', label: 'Notifications', icon: Bell },
      { value: 'danger', label: 'Danger Zone', icon: Trash2 },
    ],
    []
  );

  const score = strengthOf(passwords.next);
  const strength = STRENGTH[score];

  const setAccountField = (name, value) => {
    setAccount((current) => ({ ...current, [name]: value }));
    setAccountErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const saveAccount = (event) => {
    event.preventDefault();

    const next = {};
    if (account.name.trim().length < 2) next.name = 'Enter your full name (at least 2 characters).';

    const phone = phoneError(account.phone);
    if (phone) next.phone = phone;

    setAccountErrors(next);
    if (Object.keys(next).length > 0) {
      raiseError('Please correct the highlighted fields.');
      return;
    }

    const patch = {
      name: account.name.trim(),
      phone: account.phone.trim() || null,
    };

    if (!isVolunteer) {
      patch.organizationName = account.organizationName.trim() || null;
      if (role === 'NGO') {
        patch.ngo = { organizationName: account.organizationName.trim() };
      }
    }

    updateUser(patch);
    success('Account details saved for this session. No server endpoint receives them yet.');
  };

  const savePassword = (event) => {
    event.preventDefault();

    const next = {};
    if (!passwords.current) next.current = 'Enter your current password.';

    if (passwords.next.length < 8 || !/[A-Za-z]/.test(passwords.next) || !/\d/.test(passwords.next)) {
      next.next = PASSWORD_HINT;
    }

    if (passwords.confirm !== passwords.next) {
      next.confirm = 'The two new passwords do not match.';
    }

    setPasswordErrors(next);
    if (Object.keys(next).length > 0) {
      raiseError('Please correct the highlighted fields.');
      return;
    }

    warning(
      'Password changes are not connected to the backend yet. Your current password still works.'
    );
  };

  const savePreferences = (event) => {
    event.preventDefault();
    success(
      'Notification preferences saved for this session. Email and push delivery are not connected yet.'
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header>
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Shared</p>
        <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
          Settings
        </h1>
        <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Account details, password and notification preferences for your {ROLE_LABELS[role] || role}{' '}
          account.
        </p>
        <div className="mt-3">
          <Banner variant="info" title="Session-only settings">
            The MVP has no settings endpoint yet, so changes on this page apply to the current
            session only. A reload restores the server values.
          </Banner>
        </div>
      </header>

      <Tabs items={tabs} value={activeTab} onChange={setActiveTab} ariaLabel="Settings sections" />

      {/* --- Account ------------------------------------------------------ */}
      {activeTab === 'account' && (
        <form onSubmit={saveAccount} noValidate className="flex flex-col gap-space-lg">
          <Card padding="lg" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                  <User className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Account Details
                </h2>
              </div>
              <Badge variant="outline" size="sm">
                {ROLE_LABELS[role] || role}
              </Badge>
            </div>

            <Input
              label="Full name"
              name="name"
              value={account.name}
              onChange={(event) => setAccountField('name', event.target.value)}
              leadingIcon={User}
              required
              error={accountErrors.name}
              autoComplete="name"
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              value={user?.email || ''}
              leadingIcon={Lock}
              disabled
              hint="Email is fixed to the account and can only be changed by support."
            />

            <Input
              label="Phone number"
              name="phone"
              type="tel"
              value={account.phone}
              onChange={(event) => setAccountField('phone', event.target.value)}
              leadingIcon={Phone}
              optional
              error={accountErrors.phone}
              autoComplete="tel"
            />

            {!isVolunteer && (
              <Input
                label={role === 'NGO' ? 'Organisation name' : 'Business name'}
                name="organizationName"
                value={account.organizationName}
                onChange={(event) => setAccountField('organizationName', event.target.value)}
                leadingIcon={Building2}
                optional
              />
            )}

            <div className="flex flex-col gap-2 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" variant="primary">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Changes
              </Button>
              <Button as={Link} to="/profile/edit" variant="outline">
                Edit role details
              </Button>
            </div>

            <p className="flex items-start gap-2 font-label-sm text-label-sm text-outline">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Use Edit Profile for the role fields: donor type, organisation address, capacity,
              city, availability and vehicle.
            </p>
          </Card>
        </form>
      )}

      {/* --- Security ----------------------------------------------------- */}
      {activeTab === 'security' && (
        <form onSubmit={savePassword} noValidate className="flex flex-col gap-space-lg">
          <Card padding="lg" className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Change Password
              </h2>
            </div>

            <Banner variant="warning" title="Password endpoint not available">
              This form validates and scores a new password, but the backend has no password-change
              route yet. Nothing is sent, and your current password keeps working.
            </Banner>

            <Input
              label="Current password"
              name="currentPassword"
              type="password"
              value={passwords.current}
              onChange={(event) => {
                setPasswords((current) => ({ ...current, current: event.target.value }));
                setPasswordErrors((current) => ({ ...current, current: undefined }));
              }}
              leadingIcon={Lock}
              required
              error={passwordErrors.current}
              autoComplete="current-password"
            />

            <div>
              <Input
                label="New password"
                name="newPassword"
                type="password"
                value={passwords.next}
                onChange={(event) => {
                  setPasswords((current) => ({ ...current, next: event.target.value }));
                  setPasswordErrors((current) => ({ ...current, next: undefined }));
                }}
                leadingIcon={KeyRound}
                required
                error={passwordErrors.next}
                hint={PASSWORD_HINT}
                autoComplete="new-password"
              />

              {passwords.next && (
                <div className="mt-3" aria-live="polite">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className={cn('h-full rounded-full transition-all', strength.colour, strength.width)}
                    />
                  </div>
                  <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                    Password strength: <span className="font-semibold">{strength.label}</span>
                  </p>
                </div>
              )}

              <ul className="mt-3 grid grid-cols-1 gap-1.5 xs:grid-cols-2">
                {PASSWORD_RULES.map((rule) => {
                  const passed = passwords.next ? rule.test(passwords.next) : false;
                  return (
                    <li
                      key={rule.key}
                      className={cn(
                        'flex items-start gap-1.5 font-label-sm text-label-sm',
                        passed ? 'text-secondary' : 'text-outline'
                      )}
                    >
                      <Check
                        className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', !passed && 'opacity-40')}
                        aria-hidden="true"
                      />
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <Input
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              value={passwords.confirm}
              onChange={(event) => {
                setPasswords((current) => ({ ...current, confirm: event.target.value }));
                setPasswordErrors((current) => ({ ...current, confirm: undefined }));
              }}
              leadingIcon={ShieldCheck}
              required
              error={passwordErrors.confirm}
              autoComplete="new-password"
            />

            <Button type="submit" variant="primary" className="self-start">
              <Save className="h-4 w-4" aria-hidden="true" />
              Update Password
            </Button>
          </Card>
        </form>
      )}

      {/* --- Notifications ------------------------------------------------ */}
      {activeTab === 'notifications' && (
        <form onSubmit={savePreferences} className="flex flex-col gap-space-lg">
          <Card padding="lg" className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                <Bell className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Notification Preferences
              </h2>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Labels change with your role. These choices are stored for this session only; the
              notification list itself is labelled sample data.
            </p>

            <div className="flex flex-col gap-4">
              {notificationOptions.map((option) => (
                <div key={option.key} className="rounded-xl bg-surface-container-low p-4">
                  <Toggle
                    id={`notif-${option.key}`}
                    checked={Boolean(prefs[option.key])}
                    onChange={(next) =>
                      setPrefs((current) => ({ ...current, [option.key]: next }))
                    }
                    label={option.label}
                    description={option.description}
                  />
                </div>
              ))}
            </div>

            <Button type="submit" variant="primary" className="self-start">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Preferences
            </Button>

            <p className="flex items-start gap-2 font-label-sm text-label-sm text-outline">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Email and push delivery are not connected in this MVP.
            </p>
          </Card>
        </form>
      )}

      {/* --- Danger zone -------------------------------------------------- */}
      {activeTab === 'danger' && (
        <Card padding="lg" className="flex flex-col gap-5 border border-error/30 bg-error/5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-error-container text-error">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-error">
              Delete Account
            </h2>
          </div>

          <p className="font-body-md text-body-md text-on-surface-variant">
            Permanently delete your account and all associated data. To confirm, type{' '}
            <strong className="text-error">DELETE</strong> below.
          </p>

          <Input
            label="Type DELETE to confirm"
            name="deleteConfirm"
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            autoComplete="off"
          />

          <Button
            type="button"
            variant="danger"
            disabled={deleteConfirm !== 'DELETE'}
            onClick={() => setDeleteOpen(true)}
            className="self-start"
          >
            Permanently Delete Account
          </Button>

          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Account deletion has no API endpoint in this MVP. The confirmation above is a real gate,
            but no record is removed.
          </p>
        </Card>
      )}

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete account"
        subtitle="Not available in this MVP"
        icon={TriangleAlert}
        tone="danger"
        size="sm"
        footer={
          <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="font-body-md text-body-md text-on-surface-variant">
          There is no delete-account endpoint in the current API, so this action cannot remove your
          user, donations or pickups. Contact system administration if the account must be removed.
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Nothing has been deleted by opening this dialog.
        </p>
      </Modal>
    </div>
  );
}
