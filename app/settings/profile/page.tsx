import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProfileForm } from '@/app/settings/profile/profile';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

const breadcrumbItems = [
  { title: 'Settings', link: '/settings' },
  { title: 'Profile', link: '/settings/profile' }
];
export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex h-full flex-col space-y-2">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={'Customize your Profile settings'}
            description="Configure your profile settings to personalize your experience."
          />
        </div>
        <Separator />
        <ProfileForm />
      </div>
    </PageContainer>
  );
}
