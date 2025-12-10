'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderKanban, Map, CheckSquare, Key, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

const navItems = [
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/todos', label: 'Todos', icon: CheckSquare },
  { href: '/keychain', label: 'Keychain', icon: Key },
];

export function MobileNav() {
  const pathname = usePathname();
  const { openQuickAdd } = useUIStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Add Button */}
        <button
          onClick={() => openQuickAdd('project')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </button>

        {navItems.slice(2).map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
