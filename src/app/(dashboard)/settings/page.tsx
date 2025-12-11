'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUIStore } from '@/stores/ui-store';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useUIStore();

  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <Header title="Settings" />

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how Project Hub looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="flex-1"
              >
                <Monitor className="mr-2 h-4 w-4" />
                System
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
            <CardDescription>Quick keys to navigate faster</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { keys: '⌘ K', description: 'Open command palette' },
                { keys: '⌘ N', description: 'New project' },
                { keys: '⌘ /', description: 'Toggle sidebar' },
                { keys: '⌘ D', description: 'Toggle dark mode' },
              ].map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs font-medium">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
