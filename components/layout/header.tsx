import ThemeToggle from '@/components/layout/ThemeToggle/theme-toggle';
import { cn } from '@/lib/utils';
import { MobileSidebar } from './mobile-sidebar';
import { UserNav } from './user-nav';
import { NavItem } from '@/types';

type HeaderProps = {
  navItems: NavItem[];
};

const Header: React.FC<HeaderProps> = ({ navItems }) => {
  return (
    <header className="sticky inset-x-0 top-0 w-full">
      <nav className="flex items-center justify-between px-4 py-2 md:justify-end">
        <div className={cn('block md:!hidden lg:!hidden')}>
          <MobileSidebar navItems={navItems} />
        </div>
        <div className="flex items-center gap-2">
          <UserNav />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Header;
