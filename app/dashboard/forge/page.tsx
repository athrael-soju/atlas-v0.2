import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { ForgeForm } from './forge-form';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Forge', link: '/dashboard/forge' }
];

export default function page() {
  return (
    <PageContainer scrollable={true}>
      <div className="space-y-2">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={'Customize your Forge'}
            description="Configure your Forge settings to achieve optimum results."
          />
        </div>
        <Separator />
        <ForgeForm />
      </div>
    </PageContainer>
  );
}
