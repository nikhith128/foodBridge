import { useCallback, useEffect, useState } from 'react';

/**
 * Remembers whether the dashboard sidebar is collapsed to its icon rail.
 *
 * Design.md section 7 says the sidebar is "collapsible to icons"; the screens
 * carry the button but never show the collapsed state. Step B4 decision: build
 * the behaviour and persist the choice, so a reload does not spring the sidebar
 * back open.
 *
 * Reads localStorage lazily and defensively: the first render happens during
 * server-side rendering in scripts/smoke-ui.mjs, where localStorage does not
 * exist, and a browser with storage disabled throws on access rather than
 * returning null.
 */

export const SIDEBAR_COLLAPSED_KEY = 'foodbridge.ui.sidebarCollapsed';

function readStoredCollapsed() {
  try {
    return globalThis.localStorage?.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeStoredCollapsed(collapsed) {
  try {
    globalThis.localStorage?.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  } catch {
    // Storage unavailable (private mode, disabled): the sidebar simply does not
    // remember the choice across reloads.
  }
}

export default function useCollapsedSidebar() {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);

  useEffect(() => {
    writeStoredCollapsed(collapsed);
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((value) => !value), []);

  return { collapsed, toggle, setCollapsed };
}
