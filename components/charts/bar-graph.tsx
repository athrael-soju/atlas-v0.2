'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

export const description = 'LLM-related data bar chart';

const llmData = [
  { date: '2024-04-01', tokens: 222000, requests: 150 },
  { date: '2024-04-02', tokens: 97000, requests: 180 },
  { date: '2024-04-03', tokens: 167000, requests: 120 },
  { date: '2024-04-04', tokens: 242000, requests: 260 },
  { date: '2024-04-05', tokens: 373000, requests: 290 },
  { date: '2024-04-06', tokens: 301000, requests: 340 },
  { date: '2024-04-07', tokens: 245000, requests: 180 },
  { date: '2024-04-08', tokens: 409000, requests: 320 },
  { date: '2024-04-09', tokens: 59000, requests: 110 },
  { date: '2024-04-10', tokens: 261000, requests: 190 },
  { date: '2024-04-11', tokens: 327000, requests: 350 },
  { date: '2024-04-12', tokens: 292000, requests: 210 },
  { date: '2024-04-13', tokens: 342000, requests: 380 },
  { date: '2024-04-14', tokens: 137000, requests: 220 },
  { date: '2024-04-15', tokens: 120000, requests: 170 },
  { date: '2024-04-16', tokens: 138000, requests: 190 },
  { date: '2024-04-17', tokens: 446000, requests: 360 },
  { date: '2024-04-18', tokens: 364000, requests: 410 },
  { date: '2024-04-19', tokens: 243000, requests: 180 },
  { date: '2024-04-20', tokens: 89000, requests: 150 },
  { date: '2024-04-21', tokens: 137000, requests: 200 },
  { date: '2024-04-22', tokens: 224000, requests: 170 },
  { date: '2024-04-23', tokens: 138000, requests: 230 },
  { date: '2024-04-24', tokens: 387000, requests: 290 },
  { date: '2024-04-25', tokens: 215000, requests: 250 },
  { date: '2024-04-26', tokens: 75000, requests: 130 },
  { date: '2024-04-27', tokens: 383000, requests: 420 },
  { date: '2024-04-28', tokens: 122000, requests: 180 },
  { date: '2024-04-29', tokens: 315000, requests: 240 },
  { date: '2024-04-30', tokens: 454000, requests: 380 },
  { date: '2024-05-01', tokens: 165000, requests: 220 },
  { date: '2024-05-02', tokens: 293000, requests: 310 },
  { date: '2024-05-03', tokens: 247000, requests: 190 },
  { date: '2024-05-04', tokens: 385000, requests: 420 },
  { date: '2024-05-05', tokens: 481000, requests: 390 },
  { date: '2024-05-06', tokens: 498000, requests: 520 },
  { date: '2024-05-07', tokens: 388000, requests: 300 },
  { date: '2024-05-08', tokens: 149000, requests: 210 },
  { date: '2024-05-09', tokens: 227000, requests: 180 },
  { date: '2024-05-10', tokens: 293000, requests: 330 },
  { date: '2024-05-11', tokens: 335000, requests: 270 },
  { date: '2024-05-12', tokens: 197000, requests: 240 },
  { date: '2024-05-13', tokens: 197000, requests: 160 },
  { date: '2024-05-14', tokens: 448000, requests: 490 },
  { date: '2024-05-15', tokens: 473000, requests: 380 },
  { date: '2024-05-16', tokens: 338000, requests: 400 },
  { date: '2024-05-17', tokens: 499000, requests: 420 },
  { date: '2024-05-18', tokens: 315000, requests: 350 },
  { date: '2024-05-19', tokens: 235000, requests: 180 },
  { date: '2024-05-20', tokens: 177000, requests: 230 },
  { date: '2024-05-21', tokens: 82000, requests: 140 },
  { date: '2024-05-22', tokens: 81000, requests: 120 },
  { date: '2024-05-23', tokens: 252000, requests: 290 },
  { date: '2024-05-24', tokens: 294000, requests: 220 },
  { date: '2024-05-25', tokens: 201000, requests: 250 },
  { date: '2024-05-26', tokens: 213000, requests: 170 },
  { date: '2024-05-27', tokens: 420000, requests: 460 },
  { date: '2024-05-28', tokens: 233000, requests: 190 },
  { date: '2024-05-29', tokens: 78000, requests: 130 },
  { date: '2024-05-30', tokens: 340000, requests: 280 },
  { date: '2024-05-31', tokens: 178000, requests: 230 },
  { date: '2024-06-01', tokens: 178000, requests: 200 },
  { date: '2024-06-02', tokens: 470000, requests: 410 },
  { date: '2024-06-03', tokens: 103000, requests: 160 },
  { date: '2024-06-04', tokens: 439000, requests: 380 },
  { date: '2024-06-05', tokens: 88000, requests: 140 },
  { date: '2024-06-06', tokens: 294000, requests: 250 },
  { date: '2024-06-07', tokens: 323000, requests: 370 },
  { date: '2024-06-08', tokens: 385000, requests: 320 },
  { date: '2024-06-09', tokens: 438000, requests: 480 },
  { date: '2024-06-10', tokens: 155000, requests: 200 },
  { date: '2024-06-11', tokens: 92000, requests: 150 },
  { date: '2024-06-12', tokens: 492000, requests: 420 },
  { date: '2024-06-13', tokens: 81000, requests: 130 },
  { date: '2024-06-14', tokens: 426000, requests: 380 },
  { date: '2024-06-15', tokens: 307000, requests: 350 },
  { date: '2024-06-16', tokens: 371000, requests: 310 },
  { date: '2024-06-17', tokens: 475000, requests: 520 },
  { date: '2024-06-18', tokens: 107000, requests: 170 },
  { date: '2024-06-19', tokens: 341000, requests: 290 },
  { date: '2024-06-20', tokens: 408000, requests: 450 },
  { date: '2024-06-21', tokens: 169000, requests: 210 },
  { date: '2024-06-22', tokens: 317000, requests: 270 },
  { date: '2024-06-23', tokens: 480000, requests: 530 },
  { date: '2024-06-24', tokens: 132000, requests: 180 },
  { date: '2024-06-25', tokens: 141000, requests: 190 },
  { date: '2024-06-26', tokens: 434000, requests: 380 },
  { date: '2024-06-27', tokens: 448000, requests: 490 },
  { date: '2024-06-28', tokens: 149000, requests: 200 },
  { date: '2024-06-29', tokens: 103000, requests: 160 },
  { date: '2024-06-30', tokens: 446000, requests: 400 }
];

const llmChartConfig = {
  tokens: {
    label: 'Tokens Processed',
    color: 'hsl(var(--chart-1))'
  },
  requests: {
    label: 'Requests',
    color: 'hsl(var(--chart-2))'
  }
} satisfies ChartConfig;

export function BarGraph() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof llmChartConfig>('tokens');

  const total = React.useMemo(
    () => ({
      tokens: llmData.reduce((acc, curr) => acc + curr.tokens, 0),
      requests: llmData.reduce((acc, curr) => acc + curr.requests, 0)
    }),
    []
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>LLM Data</CardTitle>
          <CardDescription>
            Showing LLM activity over the last 3 months
          </CardDescription>
        </div>
        <div className="flex">
          {['tokens', 'requests'].map((key) => {
            const chart = key as keyof typeof llmChartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {llmChartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={llmChartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={llmData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
