import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { settingsNavItems } from '@/constants/nav-items';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Atlas V1',
  description: 'Even better than the first one!'
};

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
