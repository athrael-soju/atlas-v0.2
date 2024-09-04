import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { ForgeForm } from '@/app/settings/forge/forge';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

const breadcrumbItems = [
  { title: 'Settings', link: '/settings' },
  { title: 'Forge', link: '/settings/forge' }
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
