/**
 * UI component barrel.
 *
 * Import from the folder, not the file:
 *   import { Button, Badge, useToast } from '../components/ui';
 */

// --- Atoms (B2a) ------------------------------------------------------------
export { default as Button } from './Button.jsx';
export { default as Input } from './Input.jsx';
export { default as Select } from './Select.jsx';
export { default as Badge, DietBadge, STATUS } from './Badge.jsx';
export { default as Card } from './Card.jsx';

// --- Feedback and overlay (B2b) --------------------------------------------
export { default as Modal, ModalNote } from './Modal.jsx';
export { default as Toast, ToastViewport } from './Toast.jsx';
export { default as Tabs, FilterPills } from './Tabs.jsx';
export { default as Skeleton, SkeletonGroup, SkeletonText, SkeletonCircle, SkeletonCard } from './Skeleton.jsx';
export { default as EmptyState } from './EmptyState.jsx';
export { default as StepTracker } from './StepTracker.jsx';
export { default as Banner, BannerAction } from './Banner.jsx';

// Re-exported so pages have one import site for the toast API.
export { useToast, ToastProvider } from '../../context/ToastContext.jsx';
