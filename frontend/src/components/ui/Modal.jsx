import { useCallback, useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '../../utils/cn.js';

/**
 * Modal
 *
 * Markup taken from the two confirmation dialogs on the Donation Details screen
 * (Accept / Decline), which are the only modals in the design:
 *
 *   backdrop  fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm
 *   panel     bg-surface-container-lowest rounded-2xl shadow-xl max-w-lg w-full p-6
 *   header    w-12 h-12 rounded-xl icon tile + headline-sm title + mono subtitle
 *
 * The icon tile is `bg-secondary-container` for a positive action and
 * `bg-error-container text-error` for a destructive one, so `tone` controls it.
 *
 * Deliberately NOT rendered through a portal: the screens nest their modals
 * inline, and staying inline keeps the component renderable on the server
 * (which is how scripts/smoke-ui.mjs checks it). There is no competing stacking
 * context in this app, so the trade-off is free.
 */

const TONES = {
  positive: 'bg-secondary-container text-on-secondary-container',
  danger: 'bg-error-container text-error',
  neutral: 'bg-surface-container-high text-on-surface-variant',
};

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  tone = 'positive',
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
  showClose = true,
  className,
}) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useId();

  const close = useCallback(() => {
    if (typeof onClose === 'function') onClose();
  }, [onClose]);

  // Escape to close, Tab cycles inside the panel, and the page behind cannot scroll.
  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog once it has painted.
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = panel.querySelector(FOCUSABLE) || panel;
      target.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(raf);
      // Hand focus back to whatever opened the dialog.
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (closeOnBackdrop && event.target === event.currentTarget) close();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'flex w-full flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-overlay',
              'max-h-[calc(100vh-2rem)] overflow-y-auto focus:outline-none',
              SIZES[size],
              className
            )}
          >
            {(title || Icon || showClose) && (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                        TONES[tone]
                      )}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    {title && (
                      <h3
                        id={titleId}
                        className="font-display text-headline-sm font-bold text-on-surface"
                      >
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {subtitle}
                      </span>
                    )}
                  </div>
                </div>

                {showClose && (
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close dialog"
                    className={cn(
                      'rounded-lg p-1 text-outline transition-colors hover:text-on-surface',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40'
                    )}
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {children && <div className="flex flex-col gap-4">{children}</div>}

            {footer && <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The grey inset panel the screens use for explanatory text inside a dialog:
 *   p-4 rounded-xl bg-surface-container-low
 */
export function ModalNote({ children, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 font-body-md text-body-md leading-relaxed text-on-surface',
        className
      )}
    >
      {children}
    </div>
  );
}
