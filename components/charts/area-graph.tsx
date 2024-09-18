'use client';

import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

const llmData = [
  { month: 'January', accuracy: 85, utilization: 50 },
  { month: 'February', accuracy: 88, utilization: 60 },
  { month: 'March', accuracy: 83, utilization: 55 },
  { month: 'April', accuracy: 90, utilization: 65 },
  { month: 'May', accuracy: 87, utilization: 70 },
  { month: 'June', accuracy: 89, utilization: 75 }
];

const llmChartConfig = {
  accuracy: {
    label: 'Accuracy (%)',
    color: 'hsl(var(--chart-1))'
  },
  utilization: {
    label: 'Model Utilization (%)',
    color: 'hsl(var(--chart-2))'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Metrics</CardTitle>
        <CardDescription>
          Showing LLM accuracy and model utilization for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={llmChartConfig}
          className="aspect-auto h-[310px] w-full"
        >
          <AreaChart
            accessibilityLayer
            data={llmData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="utilization"
              type="natural"
              fill="var(--color-utilization)"
              fillOpacity={0.4}
              stroke="var(--color-utilization)"
              stackId="a"
            />
            <Area
              dataKey="accuracy"
              type="natural"
              fill="var(--color-accuracy)"
              fillOpacity={0.4}
              stroke="var(--color-accuracy)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              January - June 2024
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
