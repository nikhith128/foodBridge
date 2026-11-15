import { Component } from 'react';

/**
 * ErrorBoundary
 *
 * React unmounts the whole tree when a render throws, which is what turned the
 * two missing imports in Phase 1 into a blank green screen. This boundary keeps
 * the failure visible: the visitor gets a readable message and a way out
 * instead of an empty page.
 *
 * Deliberately dependency-free — no Button, no router hooks. If a UI component
 * or the auth stack is what crashed, this fallback must still render.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the technical detail in the console for whoever is debugging; the
    // screen itself stays human-readable.
    console.error('FoodBridge AI could not render this page:', error, info?.componentStack);
  }

  handleReset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;

    if (!error) return children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-margin py-space-xl">
        <div
          role="alert"
          className="w-full max-w-xl rounded-2xl bg-surface-container-lowest p-space-lg text-center shadow-card sm:p-space-xl"
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-container font-display text-headline-sm text-on-error-container"
            aria-hidden="true"
          >
            !
          </span>

          <h1 className="mt-space-md font-display text-headline-md text-primary">
            Something went wrong
          </h1>
          <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">
            This page could not be displayed. Your data is safe — try again, reload the page, or
            return to the home screen.
          </p>

          {import.meta.env.DEV && (
            <pre className="mt-space-md max-h-40 overflow-auto rounded-xl bg-surface-container p-space-md text-left font-mono text-label-sm text-error">
              {String(error?.message || error)}
            </pre>
          )}

          <div className="mt-space-lg flex flex-col justify-center gap-space-sm sm:flex-row">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-space-lg font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-outline-variant px-space-lg font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              Go to home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
