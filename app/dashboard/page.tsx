'use client';

import PageContainer from '@/components/layout/page-container';
import { Metrics } from './analytics/metrics';

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <Metrics />
    </PageContainer>
  );
}
