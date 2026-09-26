import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Button,
  Card,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  formatNumber,
} from "@z3/admin-core";
import type { ChartConfig } from "@z3/admin-core";
import type { OutreachLog } from "@z3/types";

const chartConfig = {
  sent: {
    label: "Total Sent",
    color: "#38bdf8",
  },
  delivered: {
    label: "Delivered",
    color: "#10b981",
  },
} satisfies ChartConfig;

interface OutreachActivityChartProps {
  logs: Array<{ log: OutreachLog }>;
  isLoading: boolean;
}

export function OutreachActivityChart({
  logs,
  isLoading,
}: OutreachActivityChartProps) {
  const [rangeDays, setRangeDays] = useState<7 | 14>(7);

  const chartData = useMemo(() => {
    const days: Array<{
      dateKey: string;
      label: string;
      sent: number;
      delivered: number;
    }> = [];

    const now = new Date();
    // Normalize to midnight
    now.setHours(23, 59, 59, 999);

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;

      const label =
        rangeDays === 7
          ? d.toLocaleDateString("en-US", { weekday: "short" })
          : d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });

      days.push({
        dateKey,
        label,
        sent: 0,
        delivered: 0,
      });
    }

    // Map logs to days
    for (const item of logs) {
      if (!item.log.sentAt) continue;
      const sentDate = new Date(item.log.sentAt);
      if (isNaN(sentDate.getTime())) continue;

      const year = sentDate.getFullYear();
      const month = String(sentDate.getMonth() + 1).padStart(2, "0");
      const day = String(sentDate.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;

      const matchedDay = days.find((d) => d.dateKey === dateKey);
      if (matchedDay) {
        matchedDay.sent += 1;
        if (
          item.log.status === "delivered" ||
          item.log.status === "replied" ||
          item.log.status === "sent"
        ) {
          matchedDay.delivered += 1;
        }
      }
    }

    return days;
  }, [logs, rangeDays]);

  const totalInPeriod = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.sent, 0),
    [chartData],
  );

  const totalDeliveredInPeriod = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.delivered, 0),
    [chartData],
  );

  return (
    <Card padding="md" className="h-full flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                Outreach Activity
              </h2>
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500 border border-blue-500/20">
                Email Dispatch
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily email dispatches from Quick Outreach & bulk campaign queues
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg p-1 border border-border/50 text-xs">
            <Button
              variant="barebone"
              type="button"
              onClick={() => setRangeDays(7)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                rangeDays === 7
                  ? "bg-accent text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Last 7 Days
            </Button>
            <Button
              variant="barebone"
              type="button"
              onClick={() => setRangeDays(14)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                rangeDays === 14
                  ? "bg-accent text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Last 14 Days
            </Button>
          </div>
        </div>

        <div className="mb-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {formatNumber(totalInPeriod)}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            emails sent in this window • {formatNumber(totalDeliveredInPeriod)} delivered
          </span>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-64 sm:h-72 w-full">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border/40"
          />
          <XAxis
            dataKey="label"
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
            allowDecimals={false}
          />
          <ChartTooltip
            cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar
            key="sent"
            dataKey="sent"
            name="Sent"
            fill="var(--color-sent)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}
