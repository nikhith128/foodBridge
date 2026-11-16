/**
 * Feature flags for UI that exists but is not ready to ship.
 *
 * Social sign-in has no OAuth provider yet. The Google / GitHub buttons and
 * their note stay in the codebase (SocialAuthButtons.jsx) so the section can be
 * restored by flipping this flag, but they are hidden from both auth pages.
 */
export const SHOW_SOCIAL_LOGIN = false;
