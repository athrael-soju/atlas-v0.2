'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes'; // Import the hook from next-themes
import PageContainer from '@/components/layout/page-container';
import { Loading } from '@/components/spinner';

export const Metrics = () => {
  const { theme } = useTheme();
  const grafanaTheme = theme === 'dark' ? 'dark' : 'light';
  const [loading, setLoading] = useState(true);
  const handleIframeLoad = () => {
    setLoading(false);
  };

  const grafanaUrl = `http://localhost:4000/d/rYdddlPWk/node-exporter-full?&theme=${grafanaTheme}`;
  //const grafanaUrl = `http://localhost:4000/?&theme=${grafanaTheme}`;

  return (
    <div className="relative h-[calc(100vh-85px)]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loading />
        </div>
      )}
      <iframe
        src={grafanaUrl}
        style={{
          width: '100%',
          height: '100%',
          display: loading ? 'none' : 'block'
        }}
        onLoad={handleIframeLoad}
      ></iframe>
    </div>
  );
};

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <Metrics />
    </PageContainer>
  );
}
