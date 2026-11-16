import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Zap } from 'lucide-react';

import SocialAuthButtons from '../../components/public/SocialAuthButtons.jsx';
import Logo from '../../components/shared/Logo.jsx';
import { Banner, Button, Input, useToast } from '../../components/ui/index.js';
import { SHOW_SOCIAL_LOGIN } from '../../constants/features.js';
import { AUTH_BENEFITS, DEMO_METRIC } from '../../constants/marketing.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { homePathForRole } from '../../routes/guards.js';

/**
 * Login — the public sign-in page.
 *
 * Rebuilt from the Stitch Login screen (page 2, `web_standard`): the same
 * two-panel card as Register, the gradient story panel on the left and the form
 * on the right.
 *
 * What the screen shows but this page does not:
 *   - the "Simulate Auth Flow" pill bar, which is a Stitch device for stepping
 *     through five mock states, not a feature. Only the default sign-in state is
 *     real here; the error state is produced by an actual failed request rather
 *     than a button;
 *   - the Reset Link Sent and Set New Password states, which need mail delivery
 *     and a token store. The request state itself is the /forgot-password page,
 *     which the form links to.
 *
 * On success the page navigates to the dashboard for the signed-in role, or back
 * to wherever the guard bounced the visitor from (`location.state.from`).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const EMPTY_FORM = { email: '', password: '' };

function validate(form) {
  const errors = {};

  if (!form.email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  // Login only checks that a password was typed. The strength rules belong to
  // Register; the server is the authority on whether these credentials match.
  if (!form.password) errors.password = 'Enter your password.';

  return errors;
}

// --- Local pieces -----------------------------------------------------------

function StoryPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary text-on-primary lg:col-span-5 lg:flex lg:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-secondary-fixed/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-12 bottom-20 h-48 w-48 rounded-full bg-tertiary-fixed-dim/10 blur-2xl"
      />

      <div className="relative z-10 flex flex-col gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <Logo tone="on-primary" />
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-container-lowest/15 px-3 py-1 font-label-sm text-label-sm text-secondary-fixed backdrop-blur-md">
          <Zap className="h-4 w-4" aria-hidden="true" />
          AI-Assisted Community Food Rescue
        </span>

        <div>
          <h2 className="font-display text-headline-lg-mobile font-bold leading-tight text-on-primary lg:text-headline-md">
            Welcome back
          </h2>
          <p className="mt-space-xs font-body-md text-body-md leading-relaxed text-on-primary-container">
            Log in to orchestrate surplus donations, discover real-time matches, and audit field
            pickups across the city.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 pt-space-xs">
          {AUTH_BENEFITS.LOGIN.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.key} className="flex items-start gap-space-xs">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-fixed/20 text-secondary-fixed">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <p className="font-body-sm text-body-sm leading-snug text-on-primary/90">
                  <strong className="font-semibold text-on-primary">{benefit.lead}</strong>{' '}
                  {benefit.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mt-space-md flex flex-col gap-2 rounded-xl bg-surface-container-lowest/10 p-space-sm text-on-primary backdrop-blur-md">
        <div className="relative h-24 w-full overflow-hidden rounded-xl bg-primary-container">
          <picture className="block h-full w-full">
            <source srcSet="/auth-login.webp" type="image/webp" />
            <img
              src="/auth-login.jpg"
              alt="Volunteers packing fresh surplus food for a community kitchen pickup"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </picture>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,40,20,0.55)_0%,rgba(0,40,20,0.15)_45%,transparent_100%)]"
          />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-2.5 py-0.5 shadow-sm backdrop-blur-md">
            <span
              aria-hidden="true"
              className="h-2 w-2 animate-pulse-soft rounded-full bg-secondary motion-reduce:animate-none"
            />
            <span className="font-label-sm text-[11px] text-primary">
              Sample — {DEMO_METRIC.value} {DEMO_METRIC.label.toLowerCase()}
            </span>
          </span>
        </div>
        <span className="font-label-sm text-[10px] uppercase tracking-wider text-secondary-fixed/90">
          Sample testimonial
        </span>
        <p className="font-body-sm text-body-sm italic leading-snug text-on-primary/90">
          &ldquo;FoodBridge AI makes closing the loop effortless. We diverted 180kg surplus
          yesterday within 34 minutes of closing.&rdquo;
        </p>
        <div className="flex items-center justify-between gap-2 font-label-sm text-label-sm">
          <span className="font-semibold text-mint">Harvest Hope Kitchens</span>
          <span className="text-on-primary/70">Community kitchen partner</span>
        </div>
      </div>
    </aside>
  );
}

// --- Page -------------------------------------------------------------------

export default function Login() {
  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      success(`Welcome back, ${user.name.split(' ')[0]}.`);

      // A guard that bounced the visitor here records where they were headed.
      const from = location.state?.from;
      navigate(from || homePathForRole(user.role), { replace: true });
    } catch (apiError) {
      const status = apiError?.status;
      if (status === 401) {
        setFormError(apiError.message || 'Incorrect email or password.');
      } else if (status === 0) {
        setFormError('Could not reach the server. Check that the backend is running.');
      } else {
        setFormError(apiError?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full px-gutter-mobile py-space-lg sm:py-space-xl">
      <div className="mx-auto grid w-full max-w-[1140px] grid-cols-1 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-overlay lg:min-h-[600px] lg:grid-cols-12">
        <StoryPanel />

        <div className="relative flex flex-col justify-center gap-space-lg p-6 sm:p-10 lg:col-span-7">
          <div className="mx-auto flex w-full max-w-md flex-col gap-space-md sm:gap-space-lg">
            {formError && (
              <Banner variant="error" title="Authentication failed">
                {formError}
              </Banner>
            )}

            <div className="flex flex-col gap-space-xs">
              <h1 className="font-display text-headline-md-mobile font-semibold tracking-tight text-on-surface sm:text-headline-md">
                Login to your account
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                New here?{' '}
                <Link to="/register" className="font-semibold text-secondary hover:underline">
                  Create an account
                </Link>
              </p>
            </div>

            <form className="flex flex-col gap-space-md" onSubmit={handleSubmit} noValidate>
              <Input
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@organization.org"
                leadingIcon={Mail}
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                error={errors.email}
                required
              />

              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                leadingIcon={Lock}
                value={form.password}
                onChange={(event) => setField('password', event.target.value)}
                error={errors.password}
                required
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-outline accent-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Remember me for 30 days
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="font-label-md text-label-md text-secondary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                variant="primary"
                fullWidth
                loading={submitting}
                className="mt-space-xs"
              >
                Login to Portal
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            {SHOW_SOCIAL_LOGIN && (
              <>
                <div className="relative flex items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 h-px bg-surface-container-high"
                  />
                  <span className="relative bg-surface-container-lowest px-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    or continue with
                  </span>
                </div>

                <SocialAuthButtons />
              </>
            )}

            <div className="flex flex-col items-center gap-2">
              <p className="text-center font-label-sm text-label-sm leading-relaxed text-on-surface-variant">
                By logging in, you agree to our{' '}
                <span className="font-semibold text-secondary underline underline-offset-2">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="font-semibold text-secondary underline underline-offset-2">
                  Privacy Policy
                </span>
                .
              </p>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Demo environment — seeded accounts available
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
