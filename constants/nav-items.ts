import { NavItem } from '@/types';

export const settingsNavItems: NavItem[] = [
  {
    title: 'Settings',
    href: '/settings',
    icon: 'settings',
    label: 'Settings'
  },
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: 'profile',
    label: 'profile'
  },
  {
    title: 'Forge',
    href: '/settings/forge',
    icon: 'anvil',
    label: 'Forge'
  },
  {
    title: 'Knowledgebase',
    href: '/settings/knowledgebase',
    icon: 'bookmarked',
    label: 'Knowledgebase'
  }
];

export const dashboardNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'home',
    label: 'Dashboard'
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: 'dashboard',
    label: 'Analytics'
  },
  {
    title: 'Knowledgebase',
    href: '/dashboard/knowledgebase',
    icon: 'bookmarked',
    label: 'Knowledgebase'
  },
  {
    title: 'Chat',
    href: '/dashboard/chat',
    icon: 'bot',
    label: 'Chat'
  }
];
