---
name: FoodBridge AI
colors:
  surface: '#effdf0'
  surface-dim: '#d0ded1'
  surface-bright: '#effdf0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e9f7eb'
  surface-container: '#e4f1e5'
  surface-container-high: '#deecdf'
  surface-container-highest: '#d8e6da'
  on-surface: '#131e17'
  on-surface-variant: '#404943'
  inverse-surface: '#27332b'
  inverse-on-surface: '#e6f4e8'
  outline: '#717973'
  outline-variant: '#c0c9c1'
  surface-tint: '#356850'
  primary: '#003422'
  on-primary: '#ffffff'
  primary-container: '#174c36'
  on-primary-container: '#86bc9f'
  inverse-primary: '#9cd2b5'
  secondary: '#156c42'
  on-secondary: '#ffffff'
  secondary-container: '#9ff1bd'
  on-secondary-container: '#1b7046'
  tertiary: '#472400'
  on-tertiary: '#ffffff'
  tertiary-container: '#673700'
  on-tertiary-container: '#ed9f55'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b8efd0'
  primary-fixed-dim: '#9cd2b5'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#1b5039'
  secondary-fixed: '#a2f4bf'
  secondary-fixed-dim: '#87d8a5'
  on-secondary-fixed: '#002110'
  on-secondary-fixed-variant: '#00522f'
  tertiary-fixed: '#ffdcc1'
  tertiary-fixed-dim: '#ffb778'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#6c3a00'
  background: '#effdf0'
  on-background: '#131e17'
  surface-variant: '#d8e6da'
typography:
  display:
    fontFamily: Manrope
    fontSize: 3.5rem
    fontWeight: '800'
    lineHeight: 4rem
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Manrope
    fontSize: 2.25rem
    fontWeight: '800'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 2.5rem
    fontWeight: '700'
    lineHeight: 3rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-md-mobile:
    fontFamily: Manrope
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.875rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: 0em
  title-md:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system reflects a grounded, premium environmental technology brand. It bridges the precision of AI routing with the humanitarian warmth of grassroots logistics. The aesthetic is modern, minimal, and organic—blending purposeful editorial clarity with functional utility.

- **Brand Personality**: Authoritative, ethical, intelligent, compassionate, and transparent.
- **Target Audience**: Commercial food donors (grocers, venues, restaurants), non-profit operators, and field volunteers demanding low cognitive load under time constraints.
- **Design Archetype**: Modern Organic SaaS. The system leverages calm earth-grounded tones, precise typography, gentle atmospheric blur layers, and warm physical card surfaces rather than cold mechanical tech motifs.

## Colors
The color palette anchors digital utility to natural preservation. Surfaces prioritize soft, tactile organic backgrounds over clinical starkness.

- **Primary (`#174C36`)**: Deep forest pine used for high-emphasis interactive states, brand identifiers, and primary navigation active anchors.
- **Secondary (`#3F8F62`)**: Meadow foliage for active alerts, operational confirmation tags, positive triage badges, and progress tracks.
- **Tertiary (`#E99B52`)**: Sunlit harvest orange, strictly reserved for immediate dispatch timers, expiring batch notices, AI confidence anomalies, and callouts requiring rapid intervention.
- **Surface & Canvas (`#F7F5EC`)**: Natural parchment cream foundation that mitigates glare in high-volume dashboard workflows.
- **Surface Elevate (`#FFFFFF`)**: Pure clinical white for actionable floating modules and data-dense cards.
- **Tonal Tints (`#E8F0E8`)**: Muted sage surface for subtle interactive state highlights, nested sub-sections, and badge foundations.
- **Typography (`#202B24` / `#68756B`)**: Deep woodland black for structural readability; desaturated leaf-vein neutral for auxiliary labels and timestamps.

## Typography
Typographic scale unites structural modernism with maximum legibility:

- **Headings (Manrope)**: Delivers an open, contemporary geometric silhouette with humanist nuances. Headings above 24px must use tightening negative tracking to maintain punchy presence.
- **Body & Data (Inter)**: Employs standard vertical metrics for data tables, dispatch metrics, logistics feeds, and dense metadata blocks.
- **Hierarchical Discipline**: Reserve bold weights in Inter strictly for quantitative units, micro-labels, and status indicators. Numerical readouts (weights, pickup time windows, route times) should always adopt tabular lining figures (`font-variant-numeric: tabular-nums`).

## Layout & Spacing
The layout model employs a fluid-responsive 12-column grid on desktop, scaling to 8 columns on tablet and 4 columns on mobile viewports.

- **Breakpoints**: 
  - Mobile: `< 640px` (single-column stack, bottom sheets, full-width actions)
  - Tablet: `640px - 1024px` (dual-column split: map/routing view + feed list)
  - Desktop: `> 1024px` (multi-pane logistics canvas, max content constraint of 1440px)
- **Rhythm & Grid Alignment**: All spacing adheres strictly to an 8px grid baseline (with 4px for micro-tucks). Layout transitions flow smoothly without sharp density shifts. Data cards and logistical queues prioritize generous internal breathing room (`space-lg`) to prevent input fatigue during field operations.

## Elevation & Depth
Elevation mimics organic light through foliage, prioritizing depth through diffused tints rather than harsh achromatic black drop-shadows.

- **Level 0 (Base Canvas)**: Flat `#F7F5EC` parchment background with zero elevation.
- **Level 1 (Resting Cards & Modules)**: Pure white `#FFFFFF` surface lifted via a soft ambient shadow: `0 4px 20px -2px rgba(23, 76, 54, 0.05)`. Low-contrast borders (`1px solid rgba(104, 117, 107, 0.12)`) maintain perimeter containment.
- **Level 2 (Hover States, Active Dispatch Trays)**: Elevated card state: `0 12px 32px -4px rgba(23, 76, 54, 0.08)`.
- **Level 3 (Modals, Overlays, Floating Map Panels)**: `0 20px 48px -8px rgba(32, 43, 36, 0.12)`.
- **Glassmorphism Spec**: Floating contextual control pills and persistent navigation headers adopt frosted translucency: `background: rgba(247, 245, 236, 0.82)`, combined with `backdrop-filter: blur(12px)` and a subtle interior highlight edge: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.6)`.

## Shapes
A unified radius structure of Level 2 (`0.5rem` / `8px` baseline) establishes organic tactility without appearing toy-like or juvenile.

- **Interactive Inputs & Buttons**: Rounded with `0.5rem` (8px).
- **Cards, Panels & Containers (`rounded-lg`)**: Structured with `1rem` (16px) corner radius.
- **Floating Overlays & Modals (`rounded-xl`)**: Softened with `1.5rem` (24px) corner radius.
- **Tags, Badges & Pills**: Distinctively full-rounded (`9999px`) to immediately separate categorical attributes from interactive rectangular controls.

## Components

### Buttons
- **Primary**: Solid Forest Green (`#174C36`), text `#FFFFFF`. High-contrast, tactile hover transitions with an internal soft top-edge ring (`inset 0 1px 0 rgba(255, 255, 255, 0.2)`). Height: 44px (field accessible).
- **Secondary**: Light Green fill (`#E8F0E8`), text `#174C36`. Hover state shifts surface to a slightly deeper wash with crisp label tone.
- **Tertiary / Urgent**: Accent Orange (`#E99B52`), text `#FFFFFF`. Reserved exclusively for time-critical claims or reroute alerts.
- **Ghost**: Transparent fill, text `#174C36`, zero border, active fill tint of `rgba(23, 76, 54, 0.04)`.

### Chips & Badges
- **Status Pills**: Pill-shaped (`rounded-full`), height 24px, typography `label-sm`.
- **Perishable Risk Badge**: Surface `#FFF4EA`, Text `#B86820`, Border `1px solid rgba(233, 155, 82, 0.3)`.
- **Verified Donor Badge**: Surface `#E8F0E8`, Text `#174C36`, Border `1px solid rgba(63, 143, 98, 0.25)`.
- **AI Recommendation Tag**: Glass frosted surface with an accent border: `1px solid rgba(63, 143, 98, 0.4)` and a leading icon indicator.

### Input Fields
- **Container**: White background, 1px border `rgba(104, 117, 107, 0.28)`, height 44px, radius `0.5rem`.
- **Text & Placeholder**: Value `#202B24`, Placeholder `#68756B`.
- **Focus State**: Unbroken border color `#174C36` with an outer soft atmospheric glow: `0 0 0 3px rgba(63, 143, 98, 0.18)`. No sharp high-contrast OS rings.

### Checkboxes & Radio Buttons
- **Unchecked**: 20px box, `0.25rem` radius, border `2px solid #68756B`, background `#FFFFFF`.
- **Checked**: Background `#174C36`, white checkmark or center pip, border `#174C36`. Smooth 150ms scale-in motion.

### Cards
- **Structure**: Surface `#FFFFFF`, padding `space-lg` (24px), border `1px solid rgba(104, 117, 107, 0.12)`, radius `1rem` (16px).
- **Interactive Listing Card**: Features an inline status badge, prominent cargo capacity metric in Manrope bold, pickup deadline badge, and right-aligned tertiary action.

### Specialized Logistics Elements
- **Rescue Progress Indicator**: Dual-segment segmented bar: completed route in `#3F8F62`, AI buffer estimate in `#E99B52`, remaining path in `#E8F0E8`.
- **Match Metric Callout**: High-density AI score indicator featuring a large Manrope display value alongside an organic leaf-inspired confidence ring.