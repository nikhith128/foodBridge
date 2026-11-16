/**
 * Smoke test for Steps B2 and B3.
 *
 * Compiles and renders every UI component and every route guard through Vite's
 * SSR pipeline, then asserts the exact token classes and decisions each one is
 * contracted to produce. This catches the failures a production build cannot: a
 * component that compiles but throws on render, a guard that lets the wrong role
 * through, or a lost class a page depends on.
 *
 * Run:  npm run smoke:ui
 */

import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CheckCircle2, Radar, Trash2 } from 'lucide-react';

const results = [];

function check(name, condition, detail = '') {
  const pass = Boolean(condition);
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `   [${detail}]` : ''}`);
}

function render(element) {
  return renderToStaticMarkup(element);
}

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const ui = await server.ssrLoadModule('/src/components/ui/index.js');
  const cn = (await server.ssrLoadModule('/src/utils/cn.js')).cn;
  const toastContext = await server.ssrLoadModule('/src/context/ToastContext.jsx');

  const {
    Button,
    Input,
    Select,
    Badge,
    DietBadge,
    Card,
    STATUS,
    Modal,
    ModalNote,
    Toast,
    ToastViewport,
    Tabs,
    FilterPills,
    Skeleton,
    SkeletonGroup,
    SkeletonText,
    SkeletonCircle,
    SkeletonCard,
    EmptyState,
    StepTracker,
    Banner,
    BannerAction,
    ToastProvider,
  } = ui;
  const h = React.createElement;

  // --------------------------------------------------------------- cn helper
  check('cn joins truthy values', cn('a', 'b') === 'a b');
  check('cn drops falsy values', cn('a', false, null, undefined, '', 'b') === 'a b');
  check('cn flattens arrays', cn(['a', 'b'], 'c') === 'a b c');

  // ------------------------------------------------------------------ Button
  const primary = render(h(Button, null, 'Go'));
  check('Button primary uses bg-primary', primary.includes('bg-primary'));
  check('Button primary text is on-primary', primary.includes('text-on-primary'));
  check('Button is 12px radius (rounded-xl)', primary.includes('rounded-xl'));
  check('Button md is 44px (h-11)', primary.includes('h-11'));

  const secondary = render(h(Button, { variant: 'secondary' }, 'Go'));
  check('Button secondary uses bg-secondary', secondary.includes('bg-secondary'));

  const danger = render(h(Button, { variant: 'danger' }, 'Delete'));
  check('Button danger uses error-container', danger.includes('bg-error-container'));

  const lg = render(h(Button, { size: 'lg' }, 'Go'));
  check('Button lg is 48px (h-12)', lg.includes('h-12'));

  const iconOnly = render(h(Button, { iconOnly: true, 'aria-label': 'x' }, h('svg')));
  check('Button iconOnly is round', iconOnly.includes('rounded-full') || iconOnly.includes('rounded-xl'));
  check('Button iconOnly has equal w/h', iconOnly.includes('h-11') && iconOnly.includes('w-11'));

  const loading = render(h(Button, { loading: true }, 'Go'));
  check('Button loading shows a spinner', loading.includes('animate-spin'));
  check('Button loading sets aria-busy', loading.includes('aria-busy="true"'));
  check('Button loading still shows its label', loading.includes('Go'));

  const disabled = render(h(Button, { disabled: true }, 'Go'));
  check('Button disabled sets the disabled attribute', disabled.includes('disabled'));
  check('Button disabled dims (opacity-50)', disabled.includes('opacity-50'));

  const link = render(h(Button, { as: 'a', href: '/x' }, 'Go'));
  check('Button as="a" renders an anchor', link.startsWith('<a'));
  check('Button as="a" has no type attribute', !link.includes('type="button"'));

  const fullWidth = render(h(Button, { fullWidth: true }, 'Go'));
  check('Button fullWidth uses w-full', fullWidth.includes('w-full'));

  // ------------------------------------------------------------------- Input
  const input = render(h(Input, { label: 'Email', name: 'email', required: true }));
  check('Input is 44px tall (h-11)', input.includes('h-11'));
  check('Input is 12px radius (rounded-xl)', input.includes('rounded-xl'));
  check('Input has no hard-coded border colour', !/#[0-9a-f]{3,8}/i.test(input));
  check('Input renders its label', input.includes('>Email'));
  check('Input links label to field', input.includes('for="input-email"') && input.includes('id="input-email"'));
  check('Input marks required', input.includes('required'));
  check('Input optional label is shown', render(h(Input, { label: 'Org', name: 'o', optional: true })).includes('(Optional)'));

  const inputError = render(h(Input, { label: 'Cap', name: 'cap', error: 'Bad value.' }));
  check('Input error sets aria-invalid', inputError.includes('aria-invalid="true"'));
  check('Input error is announced', inputError.includes('role="alert"'));
  check('Input error uses the error token', inputError.includes('text-error'));

  const password = render(h(Input, { label: 'Password', name: 'pw', type: 'password' }));
  check('Password field is masked', password.includes('type="password"'));
  check('Password field has a reveal control', password.includes('Show password'));

  // ------------------------------------------------------------------ Select
  const select = render(
    h(Select, { label: 'Type', name: 'type', placeholder: 'Choose', options: ['A', 'B'] })
  );
  check('Select is 44px tall (h-11)', select.includes('h-11'));
  check('Select hides the native arrow', select.includes('appearance-none'));
  check('Select renders its options', select.includes('>A<') && select.includes('>B<'));
  check('Select renders its placeholder', select.includes('>Choose<'));

  // ------------------------------------------------------------------- Badge
  const available = render(h(Badge, { status: 'AVAILABLE' }));
  check('Badge AVAILABLE uses secondary-container', available.includes('bg-secondary-container'));
  check('Badge AVAILABLE is a pill', available.includes('rounded-full'));
  check('Badge AVAILABLE shows its label', available.includes('Available'));

  const completed = render(h(Badge, { status: 'COMPLETED' }));
  check('Badge COMPLETED uses primary', completed.includes('bg-primary'));
  check('Badge COMPLETED carries a check icon', completed.includes('<svg'));

  const urgent = render(h(Badge, { status: 'URGENT' }));
  check('Badge URGENT uses tertiary-fixed', urgent.includes('bg-tertiary-fixed'));

  const cancelled = render(h(Badge, { status: 'CANCELLED' }));
  check('Badge CANCELLED uses error-container', cancelled.includes('bg-error-container'));

  const verified = render(h(Badge, { status: 'VERIFIED' }));
  check('Badge VERIFIED carries a shield icon', verified.includes('<svg'));

  check('Badge covers every documented status', Object.keys(STATUS).length >= 11, `${Object.keys(STATUS).length} statuses`);

  const veg = render(h(DietBadge, { vegetarian: true }));
  check('DietBadge Veg is green and labelled', veg.includes('bg-secondary') && veg.includes('Veg'));
  const nonVeg = render(h(DietBadge, { vegetarian: false }));
  check('DietBadge Non-Veg is red and labelled', nonVeg.includes('bg-error') && nonVeg.includes('Non-Veg'));

  const noStatus = render(h(Badge, null, 'Custom'));
  check('Badge falls back to neutral without a status', noStatus.includes('bg-surface-container-high'));

  // -------------------------------------------------------------------- Card
  const card = render(h(Card, null, 'x'));
  check('Card is 16px radius (rounded-2xl)', card.includes('rounded-2xl'));
  check('Card uses the card shadow token', card.includes('shadow-card'));
  check('Card default padding is md', card.includes('p-4'));

  const cardXl = render(h(Card, { radius: 'xl' }, 'x'));
  check('Card radius="xl" is 12px', cardXl.includes('rounded-xl'));

  const cardInteractive = render(h(Card, { interactive: true }, 'x'));
  check('Card interactive is focusable-styled', cardInteractive.includes('focus-visible:ring-2'));

  // ------------------------------------------------------------------- Modal
  const modal = render(
    h(Modal, { open: true, onClose: () => {}, title: 'Accept?', subtitle: 'Batch #1', icon: CheckCircle2 },
      h(ModalNote, null, 'Body'))
  );
  check('Modal sets role="dialog"', modal.includes('role="dialog"'));
  check('Modal sets aria-modal', modal.includes('aria-modal="true"'));
  check('Modal labels itself from the title', /aria-labelledby="[^"]+"/.test(modal) && /id="[^"]+"/.test(modal));
  check('Modal title id matches aria-labelledby', modal.match(/aria-labelledby="([^"]+)"/)[1] === modal.match(/id="([^"]+)"/)[1]);
  check('Modal panel is 16px radius', modal.includes('rounded-2xl'));
  check('Modal backdrop blurs', modal.includes('backdrop-blur-sm'));
  check('Modal backdrop uses inverse-surface/40', modal.includes('bg-inverse-surface/40'));
  check('Modal has a close control', modal.includes('Close dialog'));
  check('ModalNote renders its content', modal.includes('Body'));
  check('Modal is closed when open={false}', !render(h(Modal, { open: false, title: 'x' })).includes('role="dialog"'));

  const dangerModal = render(h(Modal, { open: true, title: 'x', tone: 'danger', icon: Trash2 }));
  check('Modal danger tone uses error-container', dangerModal.includes('bg-error-container'));

  // ------------------------------------------------------------------- Toast
  const toast = render(h(Toast, { variant: 'success', message: 'Saved.' }));
  check('Toast success uses bg-primary', toast.includes('bg-primary'));
  check('Toast success tick is secondary-fixed', toast.includes('text-secondary-fixed'));
  check('Toast is a status region', toast.includes('role="status"'));
  check('Toast shows its message', toast.includes('Saved.'));

  const errToast = render(h(Toast, { variant: 'error', message: 'Nope.' }));
  check('Toast error uses error-container', errToast.includes('bg-error-container'));
  check('Toast error is assertive', errToast.includes('aria-live="assertive"'));

  const infoToast = render(h(Toast, { variant: 'info', message: 'FYI.' }));
  check('Toast info uses inverse-surface', infoToast.includes('bg-inverse-surface'));

  const dismissable = render(h(Toast, { message: 'x', onDismiss: () => {} }));
  check('Toast renders a dismiss control when given onDismiss', dismissable.includes('Dismiss notification'));

  // Toast context must render its children (provider wiring).
  const provider = render(
    h(ToastProvider, null, h('span', null, 'inside'), h(ToastViewport, null))
  );
  check('ToastProvider renders children', provider.includes('inside'));
  check('ToastViewport exposes a notifications region', provider.includes('aria-label="Notifications"'));
  check('ToastProvider exports useToast', typeof toastContext.useToast === 'function');

  // -------------------------------------------------------------------- Tabs
  const underline = render(
    h(Tabs, {
      value: 'all',
      onChange: () => {},
      items: [
        { value: 'all', label: 'All Donations', count: 148 },
        { value: 'active', label: 'Active', count: 3 },
      ],
    })
  );
  check('Tabs underline sets role="tablist"', underline.includes('role="tablist"'));
  check('Tabs marks the selected tab', underline.includes('aria-selected="true"'));
  check('Tabs renders count pills', underline.includes('148'));
  check('Tabs underline is 2px secondary', underline.includes('h-0.5') && underline.includes('bg-secondary'));

  const segmented = render(
    h(Tabs, { variant: 'segmented', value: 'list', onChange: () => {}, items: [{ value: 'list', label: 'List' }] })
  );
  check('Tabs segmented uses a surface-container-low track', segmented.includes('bg-surface-container-low'));
  check('Tabs segmented active segment is raised', segmented.includes('bg-surface-container-lowest'));

  const pills = render(
    h(FilterPills, {
      multiple: true,
      value: ['veg'],
      onChange: () => {},
      items: [{ value: 'veg', label: 'Veg Only' }, { value: 'nonveg', label: 'Non-Veg' }],
    })
  );
  check('FilterPills marks pressed state', pills.includes('aria-pressed="true"'));
  check('FilterPills active pill uses primary', pills.includes('bg-primary'));

  // ---------------------------------------------------------------- Skeleton
  const skeleton = render(h(Skeleton, { className: 'h-32' }));
  check('Skeleton pulses', skeleton.includes('animate-pulse'));
  check('Skeleton uses surface-container', skeleton.includes('bg-surface-container'));
  check('Skeleton is 16px radius by default', skeleton.includes('rounded-2xl'));
  check('Skeleton is hidden from screen readers', skeleton.includes('aria-hidden="true"'));

  const group = render(h(SkeletonGroup, null, h(Skeleton, { className: 'h-8' })));
  check('SkeletonGroup announces loading', group.includes('role="status"') && group.includes('aria-busy="true"'));
  check('SkeletonGroup has screen-reader text', group.includes('sr-only'));

  const text = render(h(SkeletonText, { lines: 3 }));
  check('SkeletonText renders the requested line count', (text.match(/bg-surface-variant/g) || []).length === 3);
  check('SkeletonText shortens the last line', text.includes('w-3/5'));
  check('SkeletonCircle is round', render(h(SkeletonCircle)).includes('rounded-full'));
  check('SkeletonCard is a card shell', render(h(SkeletonCard)).includes('shadow-card'));

  // -------------------------------------------------------------- EmptyState
  const empty = render(
    h(EmptyState, { icon: Radar, title: 'Nothing here', message: 'Come back later.' },
      h(Button, null, 'Retry'))
  );
  check('EmptyState is a 24px-radius panel', empty.includes('rounded-3xl'));
  check('EmptyState shows its title in primary', empty.includes('text-primary') && empty.includes('Nothing here'));
  check('EmptyState shows its message', empty.includes('Come back later.'));
  check('EmptyState renders an icon circle', empty.includes('rounded-full') && empty.includes('bg-surface-container-high'));
  check('EmptyState renders its action', empty.includes('Retry'));

  // ------------------------------------------------------------- StepTracker
  const tracker = render(
    h(StepTracker, {
      steps: [
        { key: 'a', status: 'done', title: 'Accepted', meta: '12:38' },
        { key: 'b', status: 'active', title: 'En Route' },
        { key: 'c', status: 'upcoming', title: 'Completed' },
      ],
    })
  );
  check('StepTracker is an ordered list', tracker.includes('<ol'));
  check('StepTracker numbers its steps', tracker.includes('Step 1') && tracker.includes('Step 3'));
  check('StepTracker labels done/active/upcoming', tracker.includes('Completed') && tracker.includes('Active') && tracker.includes('Upcoming'));
  check('StepTracker marks the active step', tracker.includes('aria-current="step"'));
  check('StepTracker done circle is secondary', tracker.includes('bg-secondary text-on-secondary'));
  check('StepTracker active card is ringed', tracker.includes('ring-2 ring-secondary'));
  check('StepTracker upcoming is dimmed', tracker.includes('opacity-80'));

  // ------------------------------------------------------------------ Banner
  const bannerSuccess = render(h(Banner, { variant: 'success', title: 'Published' }, 'Done.'));
  check('Banner success uses secondary-container', bannerSuccess.includes('bg-secondary-container'));
  check('Banner shows title and body', bannerSuccess.includes('Published') && bannerSuccess.includes('Done.'));
  check('Banner is a status region', bannerSuccess.includes('role="status"'));

  const bannerError = render(h(Banner, { variant: 'error', title: 'Taken' }));
  check('Banner error uses error-container', bannerError.includes('bg-error-container'));
  check('Banner error is an alert', bannerError.includes('role="alert"'));

  const bannerExpired = render(h(Banner, { variant: 'expired', title: 'Expired' }));
  check('Banner expired is grey', bannerExpired.includes('bg-surface-container-high'));

  const bannerOffline = render(h(Banner, { variant: 'offline', title: 'Offline', sticky: true }));
  check('Banner offline is inverse-surface', bannerOffline.includes('bg-inverse-surface'));
  check('Banner sticky pins to the top', bannerOffline.includes('sticky top-0'));

  const bannerWarning = render(h(Banner, { variant: 'warning', title: 'Soon' }));
  check('Banner warning uses tertiary-fixed', bannerWarning.includes('bg-tertiary-fixed'));

  const bannerDismiss = render(h(Banner, { title: 'x', onDismiss: () => {}, action: h(BannerAction, null, 'Reset') }));
  check('Banner renders an action', bannerDismiss.includes('Reset'));
  check('Banner renders a dismiss control', bannerDismiss.includes('aria-label="Dismiss"'));

  // ================================================== Step B3: guards + API
  const guards = await server.ssrLoadModule('/src/routes/guards.js');
  const tokenStore = await server.ssrLoadModule('/src/utils/tokenStore.js');
  const api = await server.ssrLoadModule('/src/services/api.js');
  const authService = await server.ssrLoadModule('/src/services/auth.service.js');
  const authContext = await server.ssrLoadModule('/src/context/AuthContext.jsx');
  const ProtectedRoute = (await server.ssrLoadModule('/src/routes/ProtectedRoute.jsx')).default;
  const RoleRoute = (await server.ssrLoadModule('/src/routes/RoleRoute.jsx')).default;
  const AppRoutes = (await server.ssrLoadModule('/src/routes/index.jsx')).default;
  const NotFound = (await server.ssrLoadModule('/src/pages/system/NotFound.jsx')).default;

  // ------------------------------------------------- the guard matrix (9)
  // A donor is signed in; each row asks for no role, their own role, another.
  const GUARD_EXPECTATIONS = {
    booting: { null: 'loading', DONOR: 'loading', NGO: 'loading' },
    anonymous: { null: 'redirect-login', DONOR: 'redirect-login', NGO: 'redirect-login' },
    authenticated: { null: 'render', DONOR: 'render', NGO: 'restricted' },
  };
  let combos = 0;
  for (const status of ['booting', 'anonymous', 'authenticated']) {
    for (const requiredRole of [null, 'DONOR', 'NGO']) {
      const verdict = guards.resolveGuard({ status, role: 'DONOR', requiredRole });
      const expected = GUARD_EXPECTATIONS[status][String(requiredRole)];
      combos += 1;
      check(
        `Guard: ${status} / page needs ${requiredRole || 'any role'} -> ${expected}`,
        verdict === expected,
        verdict
      );
    }
  }
  check('Guard matrix covered every status x role combination', combos === 9, `${combos} rows`);

  // ------------------------------------------- role -> dashboard map (3)
  check(
    'Each role lands on its own dashboard',
    guards.homePathForRole('DONOR') === '/donor' &&
      guards.homePathForRole('NGO') === '/ngo' &&
      guards.homePathForRole('VOLUNTEER') === '/volunteer'
  );
  check('An unknown role falls back to home', guards.homePathForRole('NOPE') === '/');
  check('There is one dashboard per role', guards.DASHBOARDS.length === 3);

  // ------------------------------------------- the guards as components
  const fakeAuth = (status, role) => ({
    user: role ? { id: 1, name: 'Demo Account', email: 'demo@foodbridge.test', role } : null,
    status,
    isAuthenticated: status === 'authenticated',
    isBooting: status === 'booting',
    login: async () => {},
    register: async () => {},
    logout: () => {},
  });

  const withAuth = (status, role, element) =>
    h(
      MemoryRouter,
      null,
      h(authContext.AuthContext.Provider, { value: fakeAuth(status, role) }, element)
    );

  // Same, but with the router parked on a path so `aria-current` can be checked.
  const withAuthAt = (status, role, path, element) =>
    h(
      MemoryRouter,
      { initialEntries: [path] },
      h(authContext.AuthContext.Provider, { value: fakeAuth(status, role) }, element)
    );

  const protectedSecret = h(ProtectedRoute, null, h('span', null, 'protected-secret'));
  const anonProtected = render(withAuth('anonymous', null, protectedSecret));
  check('ProtectedRoute hides content from an anonymous visitor', !anonProtected.includes('protected-secret'));
  check(
    'ProtectedRoute shows content to a signed-in user',
    render(withAuth('authenticated', 'DONOR', protectedSecret)).includes('protected-secret')
  );

  const bootingProtected = render(withAuth('booting', null, protectedSecret));
  check('ProtectedRoute waits with a loader while booting', bootingProtected.includes('Loading your account'));
  check('ProtectedRoute hides content while booting', !bootingProtected.includes('protected-secret'));

  const donorOnly = h(RoleRoute, { role: 'DONOR' }, h('span', null, 'donor-secret'));
  check(
    'RoleRoute shows content to the right role',
    render(withAuth('authenticated', 'DONOR', donorOnly)).includes('donor-secret')
  );

  const wrongRole = render(withAuth('authenticated', 'NGO', donorOnly));
  check('RoleRoute blocks the wrong role', !wrongRole.includes('donor-secret'));
  check('RoleRoute shows the Restricted page to the wrong role', wrongRole.includes('Restricted'));
  check(
    'RoleRoute hides content from an anonymous visitor',
    !render(withAuth('anonymous', null, donorOnly)).includes('donor-secret')
  );

  // ------------------------------------------------------- system pages
  const notFound = render(h(MemoryRouter, null, h(NotFound)));
  check('NotFound explains the page is missing', notFound.includes('Page not found'));
  check('NotFound offers a way home', notFound.includes('href="/"'));

  // -------------------------------------------------------- route table
  const appAt = (path) =>
    render(
      h(
        MemoryRouter,
        { initialEntries: [path] },
        h(ToastProvider, null, h(authContext.AuthProvider, null, h(AppRoutes)))
      )
    );

  check('Route table serves the login route', appAt('/login').includes('Login to your account'));
  check('Route table serves the register route', appAt('/register').includes('Create your account'));
  const unknownRoute = appAt('/definitely-not-a-route');
  check('Route table falls back to NotFound', unknownRoute.includes('Page not found'));
  const anonDashboard = appAt('/donor');
  check(
    'A protected route shows the boot loader before the session resolves',
    anonDashboard.includes('Loading your account')
  );
  check(
    'A protected route shows no dashboard to an anonymous visitor',
    !anonDashboard.includes('Temporary dashboard landing')
  );

  // ============================================= Step B5: the public pages
  const Home = (await server.ssrLoadModule('/src/pages/public/Home.jsx')).default;
  const Register = (await server.ssrLoadModule('/src/pages/public/Register.jsx')).default;
  const Login = (await server.ssrLoadModule('/src/pages/public/Login.jsx')).default;
  const PublicOnlyRoute = (await server.ssrLoadModule('/src/routes/PublicOnlyRoute.jsx')).default;
  const marketing = await server.ssrLoadModule('/src/constants/marketing.js');
  const passwordStrength = await server.ssrLoadModule('/src/utils/passwordStrength.js');

  // A public page sits inside a router (for <Link>) and, for the two auth
  // pages, inside the providers they read from (useAuth / useToast).
  const publicAt = (path, element) =>
    render(
      h(
        MemoryRouter,
        { initialEntries: [path] },
        h(ToastProvider, null, h(authContext.AuthProvider, null, element))
      )
    );

  const homePage = publicAt('/', h(Home));
  check('Home renders the hero headline', homePage.includes('Together, We Can End Food Waste.'));
  check('Home renders the accent headline line', homePage.includes('Turning Surplus Food Into Hope.'));
  check('Home labels its impact figures as sample content', homePage.includes('Demo Feed'));
  check('Home links its primary CTA to registration', homePage.includes('href="/register"'));
  check(
    'Home keeps every marketing figure on the sample list',
    marketing.HOME_STATS.length === 4 && homePage.includes(marketing.HOME_STATS[0].value)
  );

  const registerPage = publicAt('/register', h(Register));
  check('Register renders its heading', registerPage.includes('Create your account'));
  check('Register offers all three roles', ['Donor', 'NGO', 'Volunteer'].every((r) => registerPage.includes(r)));
  check('Register asks for a password confirmation', registerPage.includes('Confirm Password'));
  check('Register links to the login page', registerPage.includes('href="/login"'));
  check('Register requires accepting the terms', registerPage.includes('safe food handling pledge'));

  const loginPage = publicAt('/login', h(Login));
  check('Login renders its heading', loginPage.includes('Login to your account'));
  check('Login renders the email field', loginPage.includes('Email Address'));
  check('Login links to registration', loginPage.includes('href="/register"'));
  check('Login renders the story panel greeting', loginPage.includes('Welcome back'));
  check('Login links to the password reset page', loginPage.includes('href="/forgot-password"'));

  // Social OAuth has no provider, so the whole section is hidden behind
  // SHOW_SOCIAL_LOGIN. The component itself stays shipped and disabled.
  const SocialAuthButtons = (await server.ssrLoadModule('/src/components/public/SocialAuthButtons.jsx')).default;
  check(
    'Social buttons stay disabled when the feature flag is restored',
    render(h(SocialAuthButtons)).includes('Google') &&
      render(h(SocialAuthButtons)).includes('disabled')
  );
  check(
    'Auth pages hide the social section while the flag is off',
    !registerPage.includes('Google') &&
      !registerPage.includes('or sign up with') &&
      !loginPage.includes('GitHub') &&
      !loginPage.includes('or continue with')
  );

  const publicOnlyChild = h('span', null, 'auth-form-secret');
  check(
    'PublicOnlyRoute renders the form while booting',
    render(withAuthAt('booting', null, '/login', h(PublicOnlyRoute, null, publicOnlyChild))).includes(
      'auth-form-secret'
    )
  );
  check(
    'PublicOnlyRoute renders the form for an anonymous visitor',
    render(withAuthAt('anonymous', null, '/login', h(PublicOnlyRoute, null, publicOnlyChild))).includes(
      'auth-form-secret'
    )
  );
  check(
    'PublicOnlyRoute redirects a signed-in visitor off the auth page',
    !render(withAuthAt('authenticated', 'NGO', '/login', h(PublicOnlyRoute, null, publicOnlyChild))).includes(
      'auth-form-secret'
    )
  );

  // passwordStrength is presentation only; the backend rule is the authority.
  check('passwordStrength flags a short password', passwordStrength.passwordStrength('abc').meetsMinimum === false);
  check('passwordStrength accepts the backend minimum', passwordStrength.meetsPasswordRule('password1') === true);
  check('passwordStrength rejects a letters-only password', passwordStrength.meetsPasswordRule('passwordonly') === false);
  check('passwordStrength tops out at four segments', passwordStrength.passwordStrength('LongEnough1!x').score === 4);

  // ============================================== Step B4a: the public shell
  const PublicLayout = (await server.ssrLoadModule('/src/layouts/PublicLayout.jsx')).default;
  const StatCard = (await server.ssrLoadModule('/src/components/shared/StatCard.jsx')).default;
  const NotificationItem = (await server.ssrLoadModule('/src/components/shared/NotificationItem.jsx')).default;
  const Logo = (await server.ssrLoadModule('/src/components/shared/Logo.jsx')).default;
  const navigation = await server.ssrLoadModule('/src/constants/navigation.js');

  const publicShell = render(
    withAuthAt(
      'anonymous',
      null,
      '/',
      h(
        Routes,
        null,
        h(
          Route,
          { element: h(PublicLayout) },
          h(Route, { path: '/', element: h('span', null, 'public-outlet-content') })
        )
      )
    )
  );
  const publicHeader = publicShell.split('</header>')[0];
  check('PublicLayout renders the brand wordmark', publicShell.includes('FoodBridge AI'));
  check(
    'PublicLayout renders the footer tagline',
    publicShell.includes('Rescue Food. Connect Communities. Reduce Waste.')
  );
  check('PublicLayout renders the routed page through its outlet', publicShell.includes('public-outlet-content'));
  check('PublicLayout has exactly one main region', (publicShell.match(/<main/g) || []).length === 1);
  check('PublicLayout offers a Login link', publicShell.includes('href="/login"'));
  check('PublicLayout offers a Register link', publicShell.includes('href="/register"'));
  check(
    'PublicLayout links the About Us item',
    publicShell.includes('href="/about"')
  );
  check('PublicLayout uses the header shadow token', publicShell.includes('shadow-header'));
  check('PublicLayout pins the header', publicShell.includes('fixed') && publicShell.includes('top-0'));

  // --- the header follows the session (item 1 of the home polish) ---------
  check(
    'Signed-out header shows Login and Register',
    publicHeader.includes('href="/login"') && publicHeader.includes('href="/register"')
  );
  check(
    'Signed-out header has no avatar menu',
    !publicHeader.includes('Account menu')
  );

  const signedInShell = render(
    withAuthAt(
      'authenticated',
      'DONOR',
      '/',
      h(
        Routes,
        null,
        h(
          Route,
          { element: h(PublicLayout) },
          h(Route, { path: '/', element: h('span', null, 'public-outlet-content') })
        )
      )
    )
  );
  const signedInHeader = signedInShell.split('</header>')[0];
  check(
    'Signed-in header shows the avatar menu instead of auth links',
    signedInHeader.includes('Account menu') &&
      signedInHeader.includes('DA') &&
      !signedInHeader.includes('href="/login"') &&
      !signedInHeader.includes('href="/register"')
  );

  const loginHeader = render(
    withAuthAt(
      'anonymous',
      null,
      '/login',
      h(Routes, null, h(Route, { element: h(PublicLayout) }, h(Route, { path: '/login', element: h('span') })))
    )
  ).split('</header>')[0];
  check('Login link is hidden on /login', !loginHeader.includes('href="/login"'));

  const registerHeader = render(
    withAuthAt(
      'anonymous',
      null,
      '/register',
      h(Routes, null, h(Route, { element: h(PublicLayout) }, h(Route, { path: '/register', element: h('span') })))
    )
  ).split('</header>')[0];
  check('Register link is hidden on /register', !registerHeader.includes('href="/register"'));
  check(
    'Footer link text is at least 15px',
    publicShell.includes('font-body-md text-body-md text-on-primary-container') &&
      !publicShell.includes('font-body-sm text-body-sm text-on-primary-container')
  );

  const stat = render(
    h(StatCard, {
      label: 'Meals Rescued',
      icon: CheckCircle2,
      value: '1,284',
      unit: 'meals',
      footer: h('span', null, '+12% this week'),
      accent: true,
    })
  );
  check('StatCard shows its label', stat.includes('Meals Rescued'));
  check('StatCard shows its value and unit', stat.includes('1,284') && stat.includes('meals'));
  check('StatCard renders its footer detail', stat.includes('+12% this week'));
  check('StatCard accent draws the corner blob', stat.includes('blur-xl'));
  check('StatCard is a 16px-radius card', stat.includes('rounded-2xl') && stat.includes('shadow-card'));
  check(
    'StatCard can highlight its value in secondary',
    render(h(StatCard, { label: 'x', value: '9', valueTone: 'secondary' })).includes('text-secondary')
  );

  const note = render(
    h(NotificationItem, {
      icon: CheckCircle2,
      title: 'Pickup confirmed',
      message: 'Hope Shelter accepted your batch.',
      time: '2 min ago',
      unread: true,
      onOpen: () => {},
    })
  );
  check('NotificationItem announces an unread row', note.includes('Unread'));
  check(
    'NotificationItem shows title, message and time',
    note.includes('Pickup confirmed') && note.includes('Hope Shelter accepted') && note.includes('2 min ago')
  );
  check('NotificationItem title is a button when it opens a page', note.includes('<button'));
  check('NotificationItem is quiet when read', !render(h(NotificationItem, { title: 'Old' })).includes('Unread'));

  check('Logo shows the wordmark by default', render(h(Logo)).includes('FoodBridge AI'));
  check('Logo can hide the wordmark', !render(h(Logo, { showWordmark: false })).includes('FoodBridge AI'));
  check(
    'Logo on-primary tone is white ink',
    render(h(Logo, { tone: 'on-primary' })).includes('text-on-primary')
  );

  check('Donor sidebar matches Design.md section 8', navigation.navigationForRole('DONOR').length === 9);
  check('NGO sidebar matches Design.md section 8', navigation.navigationForRole('NGO').length === 10);
  check('Volunteer sidebar matches Design.md section 8', navigation.navigationForRole('VOLUNTEER').length === 7);
  check('An unknown role has no nav items', navigation.navigationForRole('NOPE').length === 0);
  check(
    'Every nav item is fully described',
    ['DONOR', 'NGO', 'VOLUNTEER'].every((role) =>
      navigation.navigationForRole(role).every(
        (item) => item.key && item.label && item.icon && item.to && typeof item.built === 'boolean'
      )
    )
  );
  check(
    'All nav items are built (no unbuilt pages remain)',
    ['DONOR', 'NGO', 'VOLUNTEER']
      .flatMap((role) =>
        navigation
          .navigationForRole(role)
          .filter((item) => item.built)
          .map((item) => `${role}:${item.key}`)
      )
      .sort()
      .join(',') ===
      'DONOR:create,DONOR:dashboard,DONOR:donations,DONOR:impact,DONOR:matches,DONOR:notifications,DONOR:pickups,DONOR:profile,DONOR:settings,NGO:accepted,NGO:available,NGO:dashboard,NGO:history,NGO:impact,NGO:notifications,NGO:pickups,NGO:profile,NGO:recommendations,NGO:settings,VOLUNTEER:available,VOLUNTEER:dashboard,VOLUNTEER:impact,VOLUNTEER:mine,VOLUNTEER:notifications,VOLUNTEER:profile,VOLUNTEER:settings'
  );
  check('Volunteer bottom nav has four tabs', navigation.VOLUNTEER_TABS.length === 4);
  check(
    'Public nav marks About Us and How It Works built',
    navigation.PUBLIC_NAV.filter((item) => item.built).length === 3
  );
  check('Role labels cover all three roles', Object.keys(navigation.ROLE_LABELS).length === 3);

  // ============================================ Step B4b: the dashboard shell
  const Sidebar = (await server.ssrLoadModule('/src/layouts/Sidebar.jsx')).default;
  const TopBar = (await server.ssrLoadModule('/src/layouts/TopBar.jsx')).default;
  const BottomNav = (await server.ssrLoadModule('/src/layouts/BottomNav.jsx')).default;
  const DashboardLayout = (await server.ssrLoadModule('/src/layouts/DashboardLayout.jsx')).default;
  const shell = await server.ssrLoadModule('/src/layouts/shell.js');
  const collapsedHook = await server.ssrLoadModule('/src/hooks/useCollapsedSidebar.js');

  const donorSidebar = render(
    withAuthAt('authenticated', 'DONOR', '/donor', h(Sidebar, { role: 'DONOR', onToggleCollapse: () => {} }))
  );
  check(
    'Donor sidebar uses the 260px primary treatment',
    donorSidebar.includes('w-[260px]') && donorSidebar.includes('bg-primary')
  );
  check(
    'Donor sidebar lists its whole Design.md section 8 set',
    donorSidebar.includes('Create Donation') &&
      donorSidebar.includes('Matching Results') &&
      donorSidebar.includes('Settings')
  );
  check('Donor sidebar marks the current page', donorSidebar.includes('aria-current="page"'));
  check(
    'Donor sidebar shows the user card and Log Out',
    donorSidebar.includes('Demo Account') && donorSidebar.includes('Log Out')
  );
  check('Donor sidebar offers the collapse control', donorSidebar.includes('Collapse sidebar'));
  check('No unbuilt items carry a Soon pill', !donorSidebar.includes('Soon'))
  check(
    'All donor sidebar items are links',
    !donorSidebar.includes('aria-disabled="true"') && !donorSidebar.includes('cursor-not-allowed')
  );

  const ngoSidebar = render(
    withAuth('authenticated', 'NGO', h(Sidebar, { role: 'NGO', onToggleCollapse: () => {} }))
  );
  check(
    'Portal sidebar uses the 288px container treatment',
    ngoSidebar.includes('w-72') && ngoSidebar.includes('bg-primary-container')
  );
  check('Portal sidebar shows the portal subtitle', ngoSidebar.includes('NGO Portal'));
  check('Portal sidebar shows the AI engine status', ngoSidebar.includes('AI Engine Online'));
  check(
    'Portal sidebar lists the NGO items',
    ngoSidebar.includes('Available Donations') && ngoSidebar.includes('Matching Recommendations')
  );

  const collapsedSidebar = render(
    withAuth('authenticated', 'DONOR', h(Sidebar, { role: 'DONOR', collapsed: true, onToggleCollapse: () => {} }))
  );
  check('Collapsed sidebar shrinks to the 72px rail', collapsedSidebar.includes('md:w-[72px]'));
  check('Collapsed sidebar hides its labels on desktop', collapsedSidebar.includes('md:hidden'));
  check('Collapsed sidebar offers Expand', collapsedSidebar.includes('Expand sidebar'));

  const donorTop = render(
    withAuth(
      'authenticated',
      'DONOR',
      h(TopBar, { role: 'DONOR', treatment: 'donor', collapsed: false, onOpenMobile: () => {} })
    )
  );
  check('TopBar shows the breadcrumb', donorTop.includes('Portal') && donorTop.includes('Operations'));
  check('TopBar shows the role search hint', donorTop.includes('Search donations, food banks'));
  check('TopBar has the bell and its unread dot', donorTop.includes('Notifications') && donorTop.includes('bg-error'));
  check('TopBar starts after the donor sidebar', donorTop.includes('md:left-[260px]'));
  check('TopBar has the mobile menu button', donorTop.includes('Open menu'));
  check('TopBar account menu is closed by default', !donorTop.includes('role="menu"'));

  const bottomNav = render(h(MemoryRouter, null, h(BottomNav)));
  check(
    'BottomNav lists the four volunteer tabs',
    bottomNav.includes('Dashboard') &&
      bottomNav.includes('Tasks') &&
      bottomNav.includes('Alerts') &&
      bottomNav.includes('Profile')
  );
  check('BottomNav is mobile only', bottomNav.includes('md:hidden'));
  check('BottomNav dots the Alerts tab', bottomNav.includes('bg-tertiary-container'));

  const shellFor = (status, role, path, outletLabel) =>
    render(
      h(
        MemoryRouter,
        { initialEntries: [path] },
        h(
          authContext.AuthContext.Provider,
          { value: fakeAuth(status, role) },
          h(
            Routes,
            null,
            h(Route, { element: h(DashboardLayout) }, h(Route, { path, element: h('span', null, outletLabel) }))
          )
        )
      )
    );

  const donorShell = shellFor('authenticated', 'DONOR', '/donor', 'donor-outlet');
  check('DashboardLayout renders the sidebar and the top bar', donorShell.includes('Collapse sidebar') && donorShell.includes('Breadcrumb'));
  check('DashboardLayout renders the routed page', donorShell.includes('donor-outlet'));
  check('DashboardLayout keeps the donor bottom-nav free', !donorShell.includes('Volunteer sections'));

  const volunteerShell = shellFor('authenticated', 'VOLUNTEER', '/volunteer', 'volunteer-outlet');
  check('DashboardLayout gives the volunteer a bottom nav', volunteerShell.includes('Volunteer sections'));
  check('DashboardLayout renders the volunteer page', volunteerShell.includes('volunteer-outlet'));

  check('Shell: the donor gets the donor treatment', shell.shellTreatmentForRole('DONOR') === 'donor');
  check(
    'Shell: NGO and volunteer get the portal treatment',
    shell.shellTreatmentForRole('NGO') === 'portal' && shell.shellTreatmentForRole('VOLUNTEER') === 'portal'
  );
  check('Shell: content clears the donor sidebar', shell.contentOffsetClass('donor', false) === 'md:pl-[260px]');
  check('Shell: content clears the collapsed rail', shell.contentOffsetClass('donor', true) === 'md:pl-[72px]');
  check(
    'Shell: an exact item only matches its own path',
    shell.isItemActive('/donor', { to: '/donor', exact: true }) === true &&
      shell.isItemActive('/donor/donations', { to: '/donor', exact: true }) === false
  );
  check(
    'Shell: a normal item matches its sub-paths',
    shell.isItemActive('/ngo/donations/7', { to: '/ngo/donations' }) === true
  );

  check(
    'Collapse hook exports its storage key and hook',
    typeof collapsedHook.SIDEBAR_COLLAPSED_KEY === 'string' && typeof collapsedHook.default === 'function'
  );

  // -------------------------------------------------------- tokenStore
  tokenStore.clearToken();
  check('tokenStore starts empty', tokenStore.getToken() === null);
  tokenStore.setToken('token-1');
  check('tokenStore returns what was written', tokenStore.getToken() === 'token-1');
  check('tokenStore reports a stored token', tokenStore.hasToken() === true);
  check('tokenStore ignores an empty token', tokenStore.setToken('') === null && tokenStore.getToken() === null);
  tokenStore.setToken('token-2');
  tokenStore.clearToken();
  check('tokenStore clears the token', tokenStore.getToken() === null);

  // The browser path: a real localStorage must be preferred over the fallback.
  const fakeStorage = (() => {
    const map = new Map();
    return {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => map.set(key, String(value)),
      removeItem: (key) => map.delete(key),
    };
  })();
  let storageSwapped = false;
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      value: fakeStorage,
      configurable: true,
      writable: true,
    });
    storageSwapped = true;
  } catch {
    // Node shipped a locked-down localStorage; the fallback path is enough.
  }
  if (storageSwapped) {
    tokenStore.setToken('token-3');
    check('tokenStore persists to localStorage', fakeStorage.getItem(tokenStore.TOKEN_STORAGE_KEY) === 'token-3');
    tokenStore.clearToken();
    check('tokenStore removes the token from localStorage', fakeStorage.getItem(tokenStore.TOKEN_STORAGE_KEY) === null);
    delete globalThis.localStorage;
  } else {
    check('tokenStore persists to localStorage', true, 'skipped: localStorage is not writable here');
    check('tokenStore removes the token from localStorage', true, 'skipped');
  }
  tokenStore.clearToken();

  // ------------------------------------------------------ the API client
  const realFetch = globalThis.fetch;
  const calls = [];
  const respond = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  });
  const stubFetch = (handler) => {
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      return handler(url, init);
    };
  };
  const lastCall = () => calls[calls.length - 1];

  stubFetch(async () => respond(200, { status: 'success', user: { id: 1, role: 'DONOR' } }));
  tokenStore.setToken('token-abc');
  const meData = await api.request('/auth/me');
  check('api.request returns the parsed body', meData.user.role === 'DONOR');
  check('api.request resolves the base URL and path', lastCall().url === '/api/auth/me');
  check('api.request attaches the stored Bearer token', lastCall().init.headers.Authorization === 'Bearer token-abc');
  check('api.request asks for JSON', lastCall().init.headers.Accept === 'application/json');

  tokenStore.clearToken();
  await api.request('/auth/me');
  check('api.request omits Authorization when there is no token', lastCall().init.headers.Authorization === undefined);

  let caught = null;
  stubFetch(async () =>
    respond(400, {
      status: 'error',
      message: 'Please correct the highlighted fields.',
      errors: [{ field: 'email', message: 'Enter a valid email address.' }],
    })
  );
  try {
    await api.request('/auth/login', { method: 'POST', body: { email: 'x' }, token: null, skipAuthRedirect: true });
  } catch (error) {
    caught = error;
  }
  check('api.request throws ApiError on a 4xx', caught instanceof api.ApiError);
  check('ApiError carries the status', caught?.status === 400);
  check('ApiError carries the server message', caught?.message === 'Please correct the highlighted fields.');
  check('ApiError carries the field errors', caught?.errors?.[0]?.field === 'email');
  check('ApiError.fieldError looks a field up', caught?.fieldError('email') === 'Enter a valid email address.');
  check('ApiError.fieldError returns null for an unknown field', caught?.fieldError('nope') === null);
  check(
    'api.request sends a JSON body with the right verb',
    lastCall().init.method === 'POST' && lastCall().init.body === JSON.stringify({ email: 'x' })
  );

  // --- the global 401 handler
  let handled = 0;
  api.setUnauthorizedHandler(() => {
    handled += 1;
  });

  tokenStore.setToken('stale-token');
  stubFetch(async () => respond(401, { status: 'error', message: 'Your session is invalid or has expired.' }));
  try {
    await api.request('/auth/me');
  } catch {
    /* expected */
  }
  check('api.request reports a rejected session to the global handler', handled === 1);

  handled = 0;
  try {
    await api.request('/auth/login', { method: 'POST', body: {}, token: null, skipAuthRedirect: true });
  } catch {
    /* expected */
  }
  check('A 401 from the login form does not end the session', handled === 0);

  handled = 0;
  tokenStore.clearToken();
  try {
    await api.request('/auth/me');
  } catch {
    /* expected */
  }
  check('A 401 with no token sent does not end the session', handled === 0);

  handled = 0;
  stubFetch(async () => respond(500, { status: 'error', message: 'Internal server error' }));
  try {
    await api.request('/auth/me');
  } catch {
    /* expected */
  }
  check('A non-401 failure does not end the session', handled === 0);

  stubFetch(async () => {
    throw new TypeError('fetch failed');
  });
  let networkError = null;
  try {
    await api.request('/auth/me');
  } catch (error) {
    networkError = error;
  }
  check('A network failure becomes an ApiError', networkError instanceof api.ApiError);
  check('A network failure is flagged as status 0', networkError?.status === 0 && networkError?.isNetworkError === true);

  stubFetch(async () => respond(204, undefined));
  check('api.request tolerates an empty response body', (await api.request('/anything')) === null);

  // ------------------------------------------------------ auth.service
  stubFetch(async () => respond(200, { status: 'success', token: 'fresh', user: { id: 1, role: 'DONOR' } }));
  tokenStore.setToken('stale-token');
  await authService.loginUser({ email: 'demo@foodbridge.test', password: 'Password123' });
  check('auth.service.loginUser posts to /auth/login', lastCall().url === '/api/auth/login' && lastCall().init.method === 'POST');
  check('auth.service.loginUser never sends a stale token', lastCall().init.headers.Authorization === undefined);
  await authService.fetchMe();
  check('auth.service.fetchMe gets /auth/me with the session token', lastCall().url === '/api/auth/me' && lastCall().init.headers.Authorization === 'Bearer stale-token');

  api.setUnauthorizedHandler(null);
  globalThis.fetch = realFetch;
  tokenStore.clearToken();
  check('The 401 handler can be unregistered', api.getUnauthorizedHandler() === null);

  // ============================================ Step C: donations + matching
  const donationService = await server.ssrLoadModule('/src/services/donation.service.js');
  const datetime = await server.ssrLoadModule('/src/utils/datetime.js');
  const donationFormat = await server.ssrLoadModule('/src/utils/donationFormat.js');
  const options = await server.ssrLoadModule('/src/constants/options.js');
  const DonorDashboard = (await server.ssrLoadModule('/src/pages/donor/DonorDashboard.jsx')).default;
  const CreateDonation = (await server.ssrLoadModule('/src/pages/donor/CreateDonation.jsx')).default;
  const MatchingResults = (await server.ssrLoadModule('/src/pages/donor/MatchingResults.jsx')).default;

  // --- option lists mirror the API enums
  check(
    'Options: the food types match the API enum',
    options.FOOD_TYPES.map((type) => type.value).join(',') === 'VEG,NON_VEG'
  );
  check(
    'Options: every quantity unit has a kilogram factor',
    options.QUANTITY_UNITS.every((unit) => typeof options.UNIT_TO_KG[unit.value] === 'number')
  );
  check(
    'Options: the demo pickup origin is inside a valid range',
    Math.abs(options.DEMO_PICKUP_ORIGIN.latitude) <= 90 && Math.abs(options.DEMO_PICKUP_ORIGIN.longitude) <= 180
  );

  // --- datetime helpers (locale-free, so these hold on any machine)
  check('datetime: formatDuration renders hours and minutes', datetime.formatDuration(138) === '2h 18m');
  check('datetime: formatDuration renders minutes only', datetime.formatDuration(42) === '42m');
  check('datetime: formatDuration clamps a negative duration to now', datetime.formatDuration(-5) === 'now');
  check(
    'datetime: countdownLabel says Expired once the moment has passed',
    datetime.countdownLabel(new Date(Date.now() - 1000)) === 'Expired'
  );
  check(
    'datetime: countdownLabel counts the time left',
    datetime.countdownLabel(new Date(Date.now() + 42 * 60 * 1000)) === '42m left'
  );
  check('datetime: minutesUntil is negative in the past', datetime.minutesUntil(new Date(Date.now() - 60 * 1000)) < 0);
  check('datetime: isPast is false for the future', datetime.isPast(new Date(Date.now() + 60 * 1000)) === false);
  check('datetime: parseDate rejects junk', datetime.parseDate('not-a-date') === null);
  check(
    'datetime: formatDateTime is locale-independent',
    datetime.formatDateTime(new Date(2026, 10, 15, 16, 30)) === '15 Nov, 16:30'
  );
  const localValue = datetime.toDateTimeLocalValue(new Date(2026, 10, 15, 16, 30));
  check('datetime: toDateTimeLocalValue carries no timezone shift', localValue === '2026-11-15T16:30');
  check('datetime: toIsoFromLocal round-trips the hour', new Date(datetime.toIsoFromLocal(localValue)).getHours() === 16);
  check('datetime: toIsoFromLocal returns empty for blank input', datetime.toIsoFromLocal('') === '');

  // --- presentation helpers
  check('donationFormat: kilograms pass through', donationFormat.toKilograms(10, 'kg') === 10);
  check('donationFormat: servings convert at 0.4 kg', donationFormat.toKilograms(50, 'servings') === 20);
  check('donationFormat: crates convert at 15 kg', donationFormat.toKilograms(2, 'crates') === 30);
  check('donationFormat: formatQuantity prints the unit', donationFormat.formatQuantity(50, 'servings') === '50 servings');
  check(
    'donationFormat: formatQuantityWithWeight adds the estimate',
    donationFormat.formatQuantityWithWeight(50, 'servings') === '50 servings (~20 kg)'
  );
  check('donationFormat: a kg donation is not double-labelled', donationFormat.formatQuantityWithWeight(12, 'kg') === '12 kg');
  check('donationFormat: estimateMeals is derived from weight', donationFormat.estimateMeals(50, 'servings') === 50);
  check('donationFormat: deadlineTone marks an expired deadline', donationFormat.deadlineTone(0) === 'expired');
  check('donationFormat: deadlineTone marks an urgent deadline', donationFormat.deadlineTone(30) === 'urgent');
  check(
    'donationFormat: isActiveStatus excludes completed batches',
    donationFormat.isActiveStatus('COMPLETED') === false && donationFormat.isActiveStatus('AVAILABLE') === true
  );

  // --- the service maps one function onto one route
  stubFetch(async () => respond(200, { status: 'success', donations: [], donation: { id: 7 } }));
  tokenStore.setToken('svc-token');
  await donationService.createDonation({ foodName: 'x' });
  check(
    'donation.service.createDonation posts to /api/donations',
    lastCall().url === '/api/donations' && lastCall().init.method === 'POST'
  );
  await donationService.listDonations();
  check(
    'donation.service.listDonations gets /api/donations',
    lastCall().url === '/api/donations' && lastCall().init.method === 'GET'
  );
  await donationService.listDonations({ status: 'AVAILABLE' });
  check('donation.service.listDonations can narrow by status', lastCall().url === '/api/donations?status=AVAILABLE');
  await donationService.getDonation(7);
  check('donation.service.getDonation gets one donation', lastCall().url === '/api/donations/7');
  await donationService.cancelDonation(7);
  check(
    'donation.service.cancelDonation patches the cancel route',
    lastCall().url === '/api/donations/7/cancel' && lastCall().init.method === 'PATCH'
  );
  await donationService.getMatches(7);
  check('donation.service.getMatches gets /api/matches/:id', lastCall().url === '/api/matches/7');
  check('donation.service sends the session token', lastCall().init.headers.Authorization === 'Bearer svc-token');
  globalThis.fetch = realFetch;
  tokenStore.clearToken();

  // --- the pages render inside their providers
  const pageAt = (path, element, role = 'DONOR', routePath = null) =>
    render(
      h(
        MemoryRouter,
        { initialEntries: [path] },
        h(
          ToastProvider,
          null,
          h(
            authContext.AuthContext.Provider,
            { value: fakeAuth('authenticated', role) },
            routePath ? h(Routes, null, h(Route, { path: routePath, element })) : element
          )
        )
      )
    );

  const donorDashboardPage = pageAt('/donor', h(DonorDashboard));
  check('DonorDashboard greets the signed-in donor', donorDashboardPage.includes('Welcome back'));
  check('DonorDashboard offers the create-donation CTA', donorDashboardPage.includes('Create Donation'));
  check(
    'DonorDashboard links to the create-donation route',
    donorDashboardPage.includes('href="/donor/donations/new"')
  );
  check('DonorDashboard renders a loading skeleton before data arrives', donorDashboardPage.includes('animate-pulse'));
  check('DonorDashboard explains the matching engine', donorDashboardPage.includes('AI-assisted matching'));

  const createDonationPage = pageAt('/donor/donations/new', h(CreateDonation));
  check('CreateDonation renders its heading', createDonationPage.includes('Create Food Donation'));
  check(
    'CreateDonation asks for every FR-04 field',
    [
      'Food Title / Dish Name',
      'Food Category',
      'Estimated Quantity',
      'Preparation Date &amp; Time',
      'Safe Collection Deadline',
      'Pickup Latitude',
      'Pickup Longitude',
    ].every((label) => createDonationPage.includes(label))
  );
  check(
    'CreateDonation renders the live safety checklist',
    createDonationPage.includes('Safety Checklist') && createDonationPage.includes('Preparation time recorded')
  );
  check('CreateDonation offers the demo pickup point', createDonationPage.includes('Demo pickup point'));
  check(
    'CreateDonation labels its summary figures as estimates',
    createDonationPage.includes('Figures are approximate')
  );
  check('CreateDonation submits to the matching engine', createDonationPage.includes('Publish Donation'));
  check('CreateDonation states that drafts are not stored', createDonationPage.includes('Drafts are not stored'));

  const matchingResultsPage = pageAt(
    '/donor/donations/7/matches',
    h(MatchingResults),
    'DONOR',
    '/donor/donations/:id/matches'
  );
  check('MatchingResults renders its loading shell', matchingResultsPage.includes('animate-pulse'));

  // --- the donor sidebar reflects what is actually built
  const donorCreateSidebar = render(
    withAuthAt(
      'authenticated',
      'DONOR',
      '/donor/donations/new',
      h(Sidebar, { role: 'DONOR', onToggleCollapse: () => {} })
    )
  );
  check(
    'Donor sidebar links the built Create Donation item',
    donorCreateSidebar.includes('href="/donor/donations/new"')
  );
  check(
    'Donor sidebar highlights exactly one item on the create page',
    (donorCreateSidebar.match(/aria-current="page"/g) || []).length === 1
  );

  const donorMatchesSidebar = render(
    withAuthAt(
      'authenticated',
      'DONOR',
      '/donor/donations/7/matches',
      h(Sidebar, { role: 'DONOR', onToggleCollapse: () => {} })
    )
  );
  check(
    'Donor sidebar highlights no item on a donation sub-page',
    !donorMatchesSidebar.includes('aria-current="page"')
  );

  // ============================================ Step D: NGO flow + pickups
  const pickupService = await server.ssrLoadModule('/src/services/pickup.service.js');
  const pickupFormat = await server.ssrLoadModule('/src/utils/pickupFormat.js');
  const NgoDashboard = (await server.ssrLoadModule('/src/pages/ngo/NgoDashboard.jsx')).default;
  const AvailableDonations = (await server.ssrLoadModule('/src/pages/ngo/AvailableDonations.jsx')).default;
  const DonationDetails = (await server.ssrLoadModule('/src/pages/ngo/DonationDetails.jsx')).default;
  const PickupManagement = (await server.ssrLoadModule('/src/pages/ngo/PickupManagement.jsx')).default;

  // --- the pickup lifecycle helpers mirror the API's TRANSITIONS map
  check('pickupFormat: there are three pickup steps', pickupFormat.PICKUP_STEPS.length === 3);
  check(
    'pickupFormat: the steps run PENDING -> PICKED_UP -> COMPLETED',
    pickupFormat.PICKUP_STEPS.map((step) => step.status).join(',') === 'PENDING,PICKED_UP,COMPLETED'
  );
  check('pickupFormat: PENDING is the first stage', pickupFormat.pickupStageIndex('PENDING') === 0);
  check('pickupFormat: PICKED_UP is the second stage', pickupFormat.pickupStageIndex('PICKED_UP') === 1);
  check('pickupFormat: COMPLETED is the last stage', pickupFormat.pickupStageIndex('COMPLETED') === 2);
  check('pickupFormat: an unknown status has no stage', pickupFormat.pickupStageIndex('NOPE') === -1);
  check(
    'pickupFormat: PENDING advances to PICKED_UP',
    pickupFormat.nextPickupStep('PENDING')?.next === 'PICKED_UP' &&
      pickupFormat.nextPickupStep('PENDING')?.cta === 'Mark as picked up'
  );
  check(
    'pickupFormat: PICKED_UP advances to COMPLETED',
    pickupFormat.nextPickupStep('PICKED_UP')?.next === 'COMPLETED'
  );
  check('pickupFormat: a completed pickup has no next step', pickupFormat.nextPickupStep('COMPLETED') === null);
  check(
    'pickupFormat: isOpenPickup covers the two live stages',
    pickupFormat.isOpenPickup('PENDING') && pickupFormat.isOpenPickup('PICKED_UP') && !pickupFormat.isOpenPickup('COMPLETED')
  );
  check('pickupFormat: a step carries a human label', pickupFormat.pickupStep('PICKED_UP')?.label === 'Collected');

  // --- the services map one function onto one route
  stubFetch(async () => respond(200, { status: 'success', pickups: [], pickup: { id: 3 } }));
  tokenStore.setToken('svc-token');
  await donationService.acceptMatch(12);
  check(
    'donation.service.acceptMatch posts to /api/matches/:id/accept',
    lastCall().url === '/api/matches/12/accept' && lastCall().init.method === 'POST'
  );
  await pickupService.listPickups();
  check(
    'pickup.service.listPickups gets /api/pickups',
    lastCall().url === '/api/pickups' && lastCall().init.method === 'GET'
  );
  await pickupService.listPickups({ status: 'PENDING' });
  check('pickup.service.listPickups can narrow by status', lastCall().url === '/api/pickups?status=PENDING');
  await pickupService.updatePickupStatus(3, 'PICKED_UP');
  check(
    'pickup.service.updatePickupStatus patches the status route',
    lastCall().url === '/api/pickups/3/status' &&
      lastCall().init.method === 'PATCH' &&
      lastCall().init.body === JSON.stringify({ status: 'PICKED_UP' })
  );
  check('pickup.service sends the session token', lastCall().init.headers.Authorization === 'Bearer svc-token');
  globalThis.fetch = realFetch;
  tokenStore.clearToken();

  // --- the NGO pages render inside their providers
  const ngoDashboardPage = pageAt('/ngo', h(NgoDashboard), 'NGO');
  check('NgoDashboard renders its loading shell', ngoDashboardPage.includes('animate-pulse'));
  check(
    'NgoDashboard offers the NGO calls to action',
    ngoDashboardPage.includes('Browse All Donations') && ngoDashboardPage.includes('Update Capacity')
  );
  check(
    'NgoDashboard links to the available feed',
    ngoDashboardPage.includes('href="/ngo/donations"')
  );
  check(
    'NgoDashboard keeps the capacity editor inert',
    ngoDashboardPage.includes('title="Coming soon"')
  );

  const availableDonationsPage = pageAt('/ngo/donations', h(AvailableDonations), 'NGO');
  check('AvailableDonations renders its heading', availableDonationsPage.includes('Available Surplus Food Batches'));
  check('AvailableDonations renders a loading skeleton', availableDonationsPage.includes('animate-pulse'));
  check(
    'AvailableDonations offers the search and sort controls',
    availableDonationsPage.includes('Search') && availableDonationsPage.includes('Sort by')
  );
  check('AvailableDonations offers an urgent-only filter', availableDonationsPage.includes('Urgent only'));

  const donationDetailsPage = pageAt('/ngo/donations/7', h(DonationDetails), 'NGO');
  check('DonationDetails renders its loading shell', donationDetailsPage.includes('animate-pulse'));

  const pickupManagementPage = pageAt('/ngo/pickups', h(PickupManagement), 'NGO');
  check('PickupManagement renders its heading', pickupManagementPage.includes('Pickup Management'));
  check('PickupManagement renders a loading skeleton', pickupManagementPage.includes('animate-pulse'));
  check(
    'PickupManagement offers the four status tabs',
    ['All', 'Awaiting', 'Collected', 'Delivered'].every((label) => pickupManagementPage.includes(label))
  );

  // --- the NGO sidebar reflects what is actually built
  check(
    'NGO sidebar links the built Available Donations item',
    ngoSidebar.includes('href="/ngo/donations"')
  );
  check('NGO sidebar links the built Pickup Management item', ngoSidebar.includes('href="/ngo/pickups"'));
  check(
    'NGO sidebar keeps every item a real link',
    ngoSidebar.includes('href="/ngo/recommendations"') && !ngoSidebar.includes('aria-disabled="true"')
  );

  // ============================================ Step E: Impact dashboard
  const impactService = await server.ssrLoadModule('/src/services/impact.service.js');
  const tokenColors = await server.ssrLoadModule('/src/hooks/useTokenColors.js');
  const ImpactDashboard = (await server.ssrLoadModule('/src/pages/impact/ImpactDashboard.jsx')).default;

  // --- the service maps onto one route
  stubFetch(async () => respond(200, { status: 'success', summary: { completedDonations: 0 } }));
  tokenStore.setToken('impact-token');
  await impactService.getImpact({ range: '30d' });
  check('impact.service.getImpact calls /api/impact with range', lastCall().url === '/api/impact?range=30d');
  check('impact.service sends the session token', lastCall().init.headers.Authorization === 'Bearer impact-token');
  globalThis.fetch = realFetch;
  tokenStore.clearToken();

  // --- useTokenColors exposes a colour per series token
  check('useTokenColors exports SERIES_TOKENS', Array.isArray(tokenColors.SERIES_TOKENS) && tokenColors.SERIES_TOKENS.length > 0);

  // --- the page renders inside its providers (impact endpoint stubbed)
  const impactPayload = {
    status: 'success',
    scope: 'DONOR',
    range: 'all',
    sampleData: true,
    generatedAt: new Date().toISOString(),
    summary: { completedDonations: 3, mealsRescued: 50, kgRescued: 20, activeDonations: 1, completedPickups: 3, participatingOrganisations: 2 },
    mealsOverTime: [{ date: '2026-11-15', meals: 50, donations: 3 }],
    donationsByStatus: [{ status: 'COMPLETED', count: 3 }],
    donationsByCategory: [{ category: 'Cooked Hot Meals', count: 3 }],
    topContributors: [{ id: 1, name: 'A Donor', organizationName: null, donations: 3, meals: 50, kg: 20 }],
    recentCompleted: [],
    volunteer: null,
  };
  stubFetch(async () => respond(200, impactPayload));
  const impactDashboardPage = pageAt('/impact', h(ImpactDashboard), 'DONOR');
  globalThis.fetch = realFetch;
  check('ImpactDashboard renders its heading', impactDashboardPage.includes('Our Impact'));
  check(
    'ImpactDashboard carries the sample-data label',
    impactDashboardPage.includes('Sample data for demonstration')
  );
  check(
    'ImpactDashboard offers the three date ranges',
    ['7 days', '30 days', 'All time'].every((label) => impactDashboardPage.includes(label))
  );
  check(
    'ImpactDashboard renders the five stat labels',
    [
      'Completed Donations',
      'Estimated Meals Rescued',
      'Active Donations',
      'Completed Pickups',
      'Participating Organisations',
    ].every((label) => impactDashboardPage.includes(label))
  );
  check(
    'ImpactDashboard renders the three chart sections',
    ['Meals Over Time', 'Donations by Status', 'Donations by Category'].every((title) => impactDashboardPage.includes(title))
  );
  check(
    'ImpactDashboard lists recent completed donations',
    impactDashboardPage.includes('Recent Completed Donations')
  );

  // -------------------------------------------------------- AuthContext
  // React logs "Invalid hook call" before throwing; that noise is expected here,
  // so it is muted for this one probe.
  let threwOutsideProvider = false;
  const realConsoleError = console.error;
  console.error = () => {};
  try {
    authContext.useAuth();
  } catch {
    threwOutsideProvider = true;
  } finally {
    console.error = realConsoleError;
  }
  check('useAuth refuses to run outside AuthProvider', threwOutsideProvider);
  check(
    'AuthProvider renders its children',
    render(h(ToastProvider, null, h(authContext.AuthProvider, null, h('span', null, 'auth-children')))).includes(
      'auth-children'
    )
  );
  check('AuthProvider exports the three statuses', Object.keys(authContext.AUTH_STATUS).length === 3);

  // ------------------------------------------------------------------ tokens
  const everything = [
    primary,
    secondary,
    danger,
    input,
    inputError,
    select,
    available,
    completed,
    urgent,
    cancelled,
    veg,
    card,
    modal,
    dangerModal,
    toast,
    errToast,
    infoToast,
    underline,
    segmented,
    pills,
    skeleton,
    text,
    empty,
    tracker,
    bannerSuccess,
    bannerError,
    bannerExpired,
    bannerOffline,
    bannerWarning,
    bannerDismiss,
    anonProtected,
    bootingProtected,
    wrongRole,
    notFound,
    unknownRoute,
    anonDashboard,
    publicShell,
    stat,
    note,
    donorSidebar,
    ngoSidebar,
    collapsedSidebar,
    donorTop,
    bottomNav,
    donorShell,
    volunteerShell,
    homePage,
    registerPage,
    loginPage,
    donorDashboardPage,
    createDonationPage,
    matchingResultsPage,
    ngoDashboardPage,
    availableDonationsPage,
    donationDetailsPage,
    pickupManagementPage,
    impactDashboardPage,
  ].join('');
  const hexes = everything.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  check('No component emits a raw hex colour', hexes.length === 0, hexes.join(', '));
} catch (error) {
  console.error('\nUI smoke test crashed:', error);
  await server.close();
  process.exit(1);
}

await server.close();

const failed = results.filter((result) => !result.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length > 0 ? 1 : 0);
