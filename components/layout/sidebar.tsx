'use client';

import React from 'react';
import { DashboardNav } from '@/components/dashboard-nav';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import Link from 'next/link';
import { NavItem } from '@/types';
import Image from 'next/image';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit'; // Import the hook
import {
  sidebarSettingsSchema,
  SidebarSettingsValues
} from '@/lib/form-schema'; // Import the schema

type SidebarProps = {
  className?: string;
  navItems: NavItem[];
};

const defaultValues: Partial<SidebarSettingsValues> = {
  sidebarExpanded: false
};

export default function Sidebar({ className, navItems }: SidebarProps) {
  const { toggle } = useSidebar();

  // Initialize the useFetchAndSubmit hook with the sidebar settings schema and default values
  const { form, onSubmit } = useFetchAndSubmit<{ sidebarExpanded: boolean }>({
    schema: sidebarSettingsSchema,
    defaultValues,
    formPath: 'settings.misc'
  });

  const handleToggle = () => {
    toggle();

    // Update the form with the new sidebar state
    form.setValue('sidebarExpanded', !form.getValues('sidebarExpanded'));

    // Trigger the form submission to save the new state
    form.handleSubmit(onSubmit)();
  };

  return (
    <aside
      className={cn(
        `relative hidden h-screen flex-none border-r bg-card transition-[width] duration-500 md:block`,
        form.getValues('sidebarExpanded') ? 'w-72' : 'w-[72px]',
        className
      )}
    >
      <div className="hidden p-5 pt-10 lg:block">
        <Link href={'https://github.com/athrael-soju/Atlas-II'} target="_blank">
          <Image
            src={'/atlas.png'}
            alt={'Atlas'}
            width={84}
            height={84}
            loading="lazy"
            style={{ marginTop: '-30px' }}
            priority={false}
          />
        </Link>
      </div>
      <ChevronRight
        className={cn(
          'absolute -right-3 top-10 z-50 cursor-pointer rounded-full border bg-background text-3xl text-foreground',
          form.getValues('sidebarExpanded') && 'rotate-180'
        )}
        onClick={handleToggle}
      />
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mt-3 space-y-1">
            <DashboardNav
              items={navItems}
              sidebarExpanded={form.getValues('sidebarExpanded')}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
