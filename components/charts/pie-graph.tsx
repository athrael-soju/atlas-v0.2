'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';

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

const chartData = [
  { model: 'GPT-3', usage: 375, fill: 'var(--color-gpt3)' },
  { model: 'GPT-4', usage: 500, fill: 'var(--color-gpt4)' },
  { model: 'Codex', usage: 287, fill: 'var(--color-codex)' },
  { model: 'Davinci', usage: 173, fill: 'var(--color-davinci)' },
  { model: 'Other', usage: 90, fill: 'var(--color-other)' }
];

const chartConfig = {
  usage: {
    label: 'Model Usage'
  },
  gpt3: {
    label: 'GPT-3',
    color: 'hsl(var(--chart-1))'
  },
  gpt4: {
    label: 'GPT-4',
    color: 'hsl(var(--chart-2))'
  },
  codex: {
    label: 'Codex',
    color: 'hsl(var(--chart-3))'
  },
  davinci: {
    label: 'Davinci',
    color: 'hsl(var(--chart-4))'
  },
  other: {
    label: 'Other',
    color: 'hsl(var(--chart-5))'
  }
} satisfies ChartConfig;

export function PieGraph() {
  const totalUsage = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.usage, 0);
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Model Usage Distribution</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[360px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="usage"
              nameKey="model"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalUsage.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Model Usage
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing model usage distribution for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
