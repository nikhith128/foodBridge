/**
 * FoodBridge AI — Tailwind theme.
 *
 * Source of truth: the Stitch screen DESIGN.md token blocks in Design/screens/.
 * Design/Design.md section 5 lists an older, brighter palette (#16A34A etc.)
 * that does NOT match the screens. Per Design.md section 2 ("if a screen and
 * this file disagree, follow the screen"), the screen tokens win.
 *
 * Rule: components must use these token names. No raw hex values in JSX.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ---------------------------------------------------------------- colour
      colors: {
        // Core brand — deep forest pine
        primary: '#003422',
        'primary-container': '#174c36',
        'primary-fixed': '#b8efd0',
        'primary-fixed-dim': '#9cd2b5',
        'on-primary': '#ffffff',
        'on-primary-container': '#86bc9f',
        'inverse-primary': '#9cd2b5',
        'surface-tint': '#356850',

        // Secondary — meadow foliage (confirmations, positive badges, progress)
        secondary: '#156c42',
        'secondary-container': '#9ff1bd',
        'secondary-fixed': '#a2f4bf',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#1b7046',

        // Tertiary — sunlit harvest orange (urgent / expiring only)
        tertiary: '#472400',
        'tertiary-container': '#673700',
        'tertiary-fixed': '#ffdcc1',
        'tertiary-fixed-dim': '#ffb778',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#ed9f55',

        // Error
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        // Surfaces
        surface: '#effdf0',
        'surface-dim': '#d0ded1',
        'surface-bright': '#effdf0',
        'surface-variant': '#d8e6da',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#e9f7eb',
        'surface-container': '#e4f1e5',
        'surface-container-high': '#deecdf',
        'surface-container-highest': '#d8e6da',
        background: '#effdf0',

        // Text
        'on-surface': '#131e17',
        'on-surface-variant': '#404943',
        'on-background': '#131e17',
        'inverse-surface': '#27332b',
        'inverse-on-surface': '#e6f4e8',

        // Lines
        outline: '#717973',
        'outline-variant': '#c0c9c1',

        // Warm neutrals named in the Stitch brand prose
        parchment: '#f7f5ec',
        sage: '#e8f0e8',
        'ink-strong': '#202b24',
        'ink-muted': '#68756b',

        // Aliases used by a handful of pages. They point at existing screen
        // tokens rather than introducing new hex values: `mint` is the pale
        // green wash (primary-fixed) and `amber` the warm urgency ink
        // (tertiary-container, WCAG AA on the surface).
        mint: '#b8efd0',
        amber: '#673700',
      },

      // NOTE: there is deliberately no `status` colour block. Design.md section
      // 6 asks for blue ACCEPTED / purple ASSIGNED / teal PICKED_UP, but the
      // screens never use those hues — they badge everything with the M3 tokens
      // above (secondary-container, tertiary-fixed, error-container, ...).
      // Per Design.md section 2 the screens win, so Badge.jsx maps each status
      // onto an existing token instead of introducing new hex values.

      // ------------------------------------------------------------ typography
      // Each family is the one its DESIGN.md token block declares: the display
      // scale is Manrope, the reading scale is Inter. Pages reference the token
      // names directly (font-headline-md, font-body-sm, ...), so they are all
      // registered here instead of being rewritten across dozens of files.
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        'headline-lg': ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        'headline-lg-mobile': ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        'headline-md': ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        'headline-md-mobile': ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        'headline-sm': ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        'title-md': ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        'body-lg': ['Inter', 'system-ui', 'sans-serif'],
        'body-md': ['Inter', 'system-ui', 'sans-serif'],
        'body-sm': ['Inter', 'system-ui', 'sans-serif'],
        'label-md': ['Inter', 'system-ui', 'sans-serif'],
        'label-sm': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['3.5rem', { lineHeight: '4rem', fontWeight: '800', letterSpacing: '-0.03em' }],
        'display-mobile': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '800', letterSpacing: '-0.02em' }],
        'headline-lg': ['2.5rem', { lineHeight: '3rem', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-lg-mobile': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700', letterSpacing: '-0.01em' }],
        'headline-md': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600', letterSpacing: '-0.015em' }],
        'headline-md-mobile': ['1.375rem', { lineHeight: '1.875rem', fontWeight: '600', letterSpacing: '-0.01em' }],
        'headline-sm': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'title-md': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em' }],
        'body-md': ['1rem', { lineHeight: '1.5rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'label-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600', letterSpacing: '0.01em' }],
        'label-sm': ['0.75rem', { lineHeight: '1rem', fontWeight: '600', letterSpacing: '0.02em' }],
      },

      // ---------------------------------------------------------------- shape
      // Mirrors the inline `borderRadius` block every Stitch screen declares,
      // which only *extends* the CDN defaults: DEFAULT .25rem, lg .5rem,
      // xl .75rem, full 9999px. The rest are Tailwind's own values.
      //
      //   rounded-lg   8px   chips, small controls
      //   rounded-xl  12px   inputs and buttons   (Design.md section 5)
      //   rounded-2xl 16px   cards                (Design.md section 5)
      //   rounded-3xl 24px   modals
      //   rounded-full       badges, avatars, icon buttons
      //
      // These are left at the screens' values on purpose: a class name copied
      // from a screen must render at the same size here.
      borderRadius: {
        none: '0px',
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },

      // -------------------------------------------------------------- spacing
      spacing: {
        gutter: '1.5rem',
        'gutter-mobile': '1rem',
        margin: '2rem',
        'margin-mobile': '1rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
      },

      // ------------------------------------------------------------ elevation
      // Diffused green-tinted shadows rather than hard black ones.
      boxShadow: {
        card: '0 4px 20px -2px rgba(23, 76, 54, 0.05)',
        'card-hover': '0 12px 32px -4px rgba(23, 76, 54, 0.08)',
        overlay: '0 20px 48px -8px rgba(32, 43, 36, 0.12)',
        button: '0 4px 16px rgba(23, 76, 54, 0.22)',
        'button-soft': '0 2px 8px rgba(23, 76, 54, 0.06)',
        // Shell chrome, lifted from the Stitch screens (page 1 header).
        header: '0 1px 8px rgba(23, 76, 54, 0.06)',
        sidebar: '0 4px 24px rgba(0, 0, 0, 0.18)',
        'sidebar-portal': '0 1px 8px rgba(0, 0, 0, 0.04)',
        'top-bar': '0 1px 8px rgba(0, 0, 0, 0.04)',
        'bottom-nav': '0 -2px 12px rgba(23, 76, 54, 0.06)',
      },

      // --------------------------------------------------------- breakpoints
      // Design.md names 390 / 768 / 1440 explicitly.
      screens: {
        xs: '390px',
        md: '768px',
        xl: '1440px',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        // Landing page micro-motion, lifted from the inline <style> block on
        // the Stitch landing screen. The screen pauses these with a
        // prefers-reduced-motion media query; here every animated element also
        // carries `motion-reduce:animate-none`, which does the same thing.
        'pulse-soft': {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.96)' },
        },
        'float-1': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-6px) rotate(-0.5deg)' },
        },
        'float-2': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(5px) rotate(0.8deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'pulse-soft': 'pulse-soft 2.8s ease-in-out infinite',
        'float-1': 'float-1 4s ease-in-out infinite',
        'float-2': 'float-2 4.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
