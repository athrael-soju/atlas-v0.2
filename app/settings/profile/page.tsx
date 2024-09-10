import { Breadcrumbs } from '@/components/breadcrumbs';
import { CreateProfileOne } from '@/app/settings/profile/create-profile';
import PageContainer from '@/components/layout/page-container';

const breadcrumbItems = [
  { title: 'Settings', link: '/settings' },
  { title: 'Profile', link: '/settings/profile' }
];
export default function page() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex h-full flex-col space-y-2">
        <Breadcrumbs items={breadcrumbItems} />
        <CreateProfileOne categories={[]} initialData={null} />
      </div>
    </PageContainer>
  );
}
