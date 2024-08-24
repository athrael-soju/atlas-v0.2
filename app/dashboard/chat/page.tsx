'use client';

import Chat from '@/components/chat/chat';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { RequiredActionFunctionToolCall } from 'openai/resources/beta/threads/runs/runs.mjs';

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

export default function page() {
  return (
    <PageContainer scrollable={true}>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <Chat functionCallHandler={functionCallHandler} />
      </div>
    </PageContainer>
  );
}
