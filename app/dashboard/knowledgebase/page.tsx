import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Knowledgebase } from '@/components/knowledgebase';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Knowledgebase', link: '/dashboard/knowledgebase' }
];

export default function page() {
  return (
    <PageContainer scrollable={true}>
      <div className="space-y-2">
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