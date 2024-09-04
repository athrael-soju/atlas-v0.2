import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { settingsNavItems } from '@/constants/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Atlas II',
  description: 'Even better than the first one!'
};
// TODO: When logging out from the settings page, the user should be redirected to the login page
export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar navItems={settingsNavItems} />
      <main className="w-full flex-1 overflow-hidden">
        <Header navItems={settingsNavItems} />
        {children}
      </main>
    </div>
  );
}
