import type { ErrorComponentProps } from "@tanstack/react-router";
import {
  createRootRouteWithContext,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import type { AuthContextValue } from "@z3/admin-core";
import { AdminLayout, ErrorState, NotFound, useAuth } from "@z3/admin-core";
import { navGroups } from "../config/navigation";

export interface RouterContext {
  auth: AuthContextValue;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: RootNotFound,
  errorComponent: RootErrorComponent,
});

function RootComponent() {
  return <Outlet />;
}

function RootNotFound() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return (
      <AdminLayout
        title="ZeroUI Admin"
        navGroups={navGroups}
        user={user ?? undefined}
        onSignOut={logout}
        enableTabs={false}
      >
        <NotFound
          onHome={() => navigate({ to: "/" })}
          onBack={() => {
            if (typeof window !== "undefined") window.history.back();
          }}
        />
      </AdminLayout>
    );
  }

  return (
    <NotFound
      fullScreen
      homeButtonText="Return to Login"
      onHome={() => navigate({ to: "/login" })}
      onBack={() => {
        if (typeof window !== "undefined") {
          window.history.back();
        }
      }}
    />
  );
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return (
      <AdminLayout
        title="ZeroUI Admin"
        navGroups={navGroups}
        user={user ?? undefined}
        onSignOut={logout}
        enableTabs={false}
      >
        <ErrorState
          error={error}
          onRetry={reset}
          onHome={() => navigate({ to: "/" })}
        />
      </AdminLayout>
    );
  }

  return (
    <ErrorState
      fullScreen
      error={error}
      onRetry={reset}
      onHome={() => navigate({ to: "/login" })}
      homeButtonText="Return to Login"
    />
  );
}

