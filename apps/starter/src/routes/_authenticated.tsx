import React from "react";
import {
  createFileRoute,
  Navigate,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { AdminLayout, NotFound, useAuth } from "@z3/admin-core";
import { navGroups } from "../config/navigation";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isLoading && !context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
  notFoundComponent: AuthenticatedNotFound,
});

function AuthenticatedNotFound() {
  const navigate = useNavigate();
  return (
    <NotFound
      onHome={() => navigate({ to: "/" })}
      onBack={() => {
        if (typeof window !== "undefined") {
          window.history.back();
        }
      }}
    />
  );
}

function AuthenticatedLayout() {
  const { user, logout, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Initializing authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <AdminLayout
      title="ZeroUI Admin"
      navGroups={navGroups}
      user={user ?? undefined}
      onSignOut={logout}
    >
      <Outlet />
    </AdminLayout>
  );
}
