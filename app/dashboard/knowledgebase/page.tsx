// app\dashboard\knowledgebase\page.tsx
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Knowledgebase } from '@/app/dashboard/knowledgebase';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Knowledgebase', link: '/dashboard/knowledgebase' }
];

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex h-full flex-col space-y-2">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={'Expand your knowledgebase'}
            description="Yeah. More is more."
          />
        </div>
        <Separator />
        <Knowledgebase />
      </div>
    </PageContainer>
  );
}
