import { useState } from "react";

import IntroSplash from "./components/intro/IntroSplash.jsx";
import { introState } from "./components/intro/introState.js";
import { ToastProvider, ToastViewport } from './components/ui/index.js';
import { AuthProvider } from './context/AuthContext.jsx';
import AppRoutes from './routes/index.jsx';

/**
 * Provider stack, outermost first:
 *
 *   ToastProvider  any screen can raise a toast
 *   AuthProvider   who is signed in; registers the global 401 handler, so it
 *                  must sit inside ToastProvider to be able to toast
 *   AppRoutes      the route table and its guards
 *
 * ToastViewport is rendered once, beside the router, so a toast raised during a
 * navigation is not unmounted with the page that raised it.
 */
export default function App() {
  const [routesReady, setRoutesReady] = useState(!introState.plays);

  return (
    <ToastProvider>
      <AuthProvider>
        <IntroSplash onDone={() => setRoutesReady(true)} />
        {routesReady && <AppRoutes />}
      </AuthProvider>
      <ToastViewport />
    </ToastProvider>
  );
}
