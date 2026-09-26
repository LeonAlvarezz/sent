import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { VisitorBarChart } from "../../modules/dashboard/components/visitor-bar-chart";
import { Card } from "@z3/admin-core";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome to ZeroUI Admin layout powered by <code>@z3/admin-core</code> and
          TanStack Router file-based routing!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm">
          <Card.Title className="text-xs text-muted-foreground uppercase tracking-wider">
            Total Revenue
          </Card.Title>
          <p className="text-2xl font-bold mt-1 text-foreground">$45,231.89</p>
        </Card>

        <Card padding="sm">
          <Card.Title className="text-xs text-muted-foreground uppercase tracking-wider">
            Subscriptions
          </Card.Title>
          <p className="text-2xl font-bold mt-1 text-foreground">+2,350</p>
        </Card>

        <Card padding="sm">
          <Card.Title className="text-xs text-muted-foreground uppercase tracking-wider">
            Active Now
          </Card.Title>
          <p className="text-2xl font-bold mt-1 text-foreground">+573</p>
        </Card>
      </div>

      <VisitorBarChart />
    </div>
  );
}
