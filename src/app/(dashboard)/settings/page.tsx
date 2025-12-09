'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Monitor, LogOut, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/stores/ui-store';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [defaultMacPath, setDefaultMacPath] = useState('~/Projects');
  const [defaultPcPath, setDefaultPcPath] = useState('C:\\Projects');

  const supabase = createClient();

  // Load profile settings
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setDefaultMacPath(profile.default_mac_path || '~/Projects');
          setDefaultPcPath(profile.default_pc_path || 'C:\\Projects');
        }
      }
    };
    loadProfile();
  }, [supabase]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          default_mac_path: defaultMacPath,
          default_pc_path: defaultPcPath,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Default Paths */}
        <Card>
          <CardHeader>
            <CardTitle>Default Paths</CardTitle>
            <CardDescription>
              Set default directory paths for new projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="macPath">Default Mac Path</Label>
              <Input
                id="macPath"
                value={defaultMacPath}
                onChange={(e) => setDefaultMacPath(e.target.value)}
                placeholder="~/Projects"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pcPath">Default PC Path</Label>
              <Input
                id="pcPath"
                value={defaultPcPath}
                onChange={(e) => setDefaultPcPath(e.target.value)}
                placeholder="C:\Projects"
              />
            </div>
            <Button onClick={handleSaveSettings} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Paths
            </Button>
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
