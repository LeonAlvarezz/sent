import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@z3/admin-core";
import type { ChartConfig } from "@z3/admin-core";

const visitorData = [
  { date: "Mon", desktop: 1420, mobile: 890 },
  { date: "Tue", desktop: 1850, mobile: 1120 },
  { date: "Wed", desktop: 2390, mobile: 1450 },
  { date: "Thu", desktop: 2890, mobile: 1780 },
  { date: "Fri", desktop: 3840, mobile: 2310 },
  { date: "Sat", desktop: 3120, mobile: 1950 },
  { date: "Sun", desktop: 2450, mobile: 1480 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#3b82f6",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

export function VisitorBarChart() {
  const [activeSegment, setActiveSegment] = useState<
    "all" | "desktop" | "mobile"
  >("all");

  const totalVisitors = visitorData.reduce(
    (acc, curr) => acc + curr.desktop + curr.mobile,
    0,
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Visitor Analytics
            </h2>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500 ring-1 ring-emerald-500/20 ring-inset">
              +18.4%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily unique visitor traffic over the last 7 days
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg p-1 border border-border/50 text-xs">
          <Button
            variant="barebone"
            type="button"
            onClick={() => setActiveSegment("all")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              activeSegment === "all"
                ? "bg-accent text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Traffic
          </Button>
          <Button
            variant="barebone"
            type="button"
            onClick={() => setActiveSegment("desktop")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              activeSegment === "desktop"
                ? "bg-accent text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Desktop
          </Button>
          <Button
            variant="barebone"
            type="button"
            onClick={() => setActiveSegment("mobile")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              activeSegment === "mobile"
                ? "bg-accent text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mobile
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {totalVisitors.toLocaleString()}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          total visitors this week
        </span>
      </div>

      <ChartContainer config={chartConfig} className="h-75 w-full">
        <BarChart
          data={visitorData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border/40"
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className="text-xs fill-muted-foreground font-medium"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className="text-xs fill-muted-foreground font-medium"
            tickFormatter={(val) => `${val}`}
          />
          <ChartTooltip
            cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar
            key="desktop"
            dataKey="desktop"
            name="Desktop"
            fill="var(--color-desktop)"
            hide={activeSegment === "mobile"}
            radius={activeSegment === "desktop" ? [6, 6, 0, 0] : [0, 0, 4, 4]}
            stackId="a"
          />
          <Bar
            key="mobile"
            dataKey="mobile"
            name="Mobile"
            fill="var(--color-mobile)"
            hide={activeSegment === "desktop"}
            radius={[6, 6, 0, 0]}
            stackId="a"
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
