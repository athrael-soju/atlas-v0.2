'use client';

import { Chat } from '@/app/dashboard/chat/chat';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { RequiredActionFunctionToolCall } from 'openai/resources/beta/threads/runs/runs.mjs';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Chat', link: '/dashboard/chat' }
];

const functionCallHandler = async (call: RequiredActionFunctionToolCall) => {
  // if (call?.function?.name !== 'get_weather') return;
  // const args = JSON.parse(call.function.arguments);
  // const data = getWeather(args.location);
  // setWeatherData(data);
  // return JSON.stringify(data);
  return '';
};

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex h-full flex-col space-y-2">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={'Chat with Atlas'}
            description="Access a vast knowledge base and chat with Atlas."
          />
        </div>
        <Separator />
        <div className="flex-grow">
          <Chat />
        </div>
      </div>
    </PageContainer>
  );
}
