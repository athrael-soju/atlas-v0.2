import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { KnowledgebaseForm } from '@/app/settings/knowledgebase/knowledgebase';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

const breadcrumbItems = [
  { title: 'Settings', link: '/settings' },
  { title: 'Knowledgebase', link: '/settings/knowledgebase' }
];

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex h-full flex-col space-y-2">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={'Customize your Knowledgebase Retrieval settings'}
            description="Configure your Knowledgebase settings to optimize your search results."
          />
        </div>
        <Separator />
        <KnowledgebaseForm />
      </div>
    </PageContainer>
  );
}
