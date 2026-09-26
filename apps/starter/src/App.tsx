import React from "react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, ThemeProvider, Toaster, useAuth, NotFound, ErrorState } from "@z3/admin-core";
import { routeTree } from "./routeTree.gen";
import { authStrategy } from "./config/auth";
import { queryClient } from "./libs/query-client";

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
  defaultNotFoundComponent: () => <NotFound fullScreen />,
  defaultErrorComponent: ({ error, reset }) => (
    <ErrorState fullScreen error={error} onRetry={reset} />
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider strategy={authStrategy}>
          <Toaster />
          <InnerApp />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
