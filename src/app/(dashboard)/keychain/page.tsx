'use client';

import { useState } from 'react';
import {
  Plus,
  Key,
  Search,
  Copy,
  Check,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  MoreHorizontal,
  Shield,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { KeychainItem, KeyEnvironment } from '@/types';

// Common services for quick selection
const commonServices = [
  'OpenAI',
  'Anthropic',
  'Stripe',
  'AWS',
  'Google Cloud',
  'Firebase',
  'Supabase',
  'Vercel',
  'GitHub',
  'Twilio',
  'SendGrid',
  'Cloudflare',
  'MongoDB',
  'Redis',
  'Other',
];

const environmentColors: Record<KeyEnvironment, string> = {
  production: 'bg-red-500/10 text-red-500 border-red-500/20',
  development: 'bg-green-500/10 text-green-500 border-green-500/20',
  staging: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

// Mock data - will be replaced with Supabase
const mockKeys: KeychainItem[] = [
  {
    id: '1',
    user_id: '1',
    project_id: null,
    name: 'OpenAI API Key',
    key_value: 'sk-1234567890abcdefghijklmnop',
    service: 'OpenAI',
    environment: 'production',
    notes: 'Main production key - $20/month limit',
    is_favorite: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: '1',
    project_id: null,
    name: 'Stripe Test Key',
    key_value: 'sk_test_abcdefghijklmnop123456',
    service: 'Stripe',
    environment: 'development',
    notes: null,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function KeychainPage() {
  const [keys, setKeys] = useState<KeychainItem[]>(mockKeys);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<KeychainItem | null>(null);
  const [deleteKey, setDeleteKey] = useState<KeychainItem | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formKeyValue, setFormKeyValue] = useState('');
  const [formService, setFormService] = useState('');
  const [formEnvironment, setFormEnvironment] = useState<KeyEnvironment>('production');
  const [formNotes, setFormNotes] = useState('');

  // Filter keys
  const filteredKeys = keys.filter((key) => {
    if (serviceFilter !== 'all' && key.service !== serviceFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        key.name.toLowerCase().includes(query) ||
        key.service?.toLowerCase().includes(query) ||
        key.notes?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Get unique services from keys
  const usedServices = [...new Set(keys.map((k) => k.service).filter(Boolean))];

  const copyKey = async (id: string, keyValue: string) => {
    await navigator.clipboard.writeText(keyValue);
    setCopiedId(id);
    toast.success('Key copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  const toggleFavorite = (id: string) => {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, is_favorite: !k.is_favorite } : k))
    );
  };

  const openEditForm = (key: KeychainItem) => {
    setEditingKey(key);
    setFormName(key.name);
    setFormKeyValue(key.key_value);
    setFormService(key.service || '');
    setFormEnvironment(key.environment);
    setFormNotes(key.notes || '');
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingKey(null);
    setFormName('');
    setFormKeyValue('');
    setFormService('');
    setFormEnvironment('production');
    setFormNotes('');
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formKeyValue.trim()) {
      toast.error('Name and key are required');
      return;
    }

    if (editingKey) {
      // Update existing
      setKeys((prev) =>
        prev.map((k) =>
          k.id === editingKey.id
            ? {
                ...k,
                name: formName,
                key_value: formKeyValue,
                service: formService || null,
                environment: formEnvironment,
                notes: formNotes || null,
                updated_at: new Date().toISOString(),
              }
            : k
        )
      );
      toast.success('Key updated');
    } else {
      // Create new
      const newKey: KeychainItem = {
        id: Math.random().toString(36).slice(2),
        user_id: '1',
        project_id: null,
        name: formName,
        key_value: formKeyValue,
        service: formService || null,
        environment: formEnvironment,
        notes: formNotes || null,
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setKeys((prev) => [newKey, ...prev]);
      toast.success('Key added to keychain');
    }

    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteKey) {
      setKeys((prev) => prev.filter((k) => k.id !== deleteKey.id));
      toast.success('Key deleted');
      setDeleteKey(null);
    }
  };

  return (
    <>
      <Header title="Keychain" />

      <div className="p-4 md:p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {usedServices.map((service) => (
                  <SelectItem key={service} value={service!}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={openNewForm}>
            <Plus className="mr-2 h-4 w-4" />
            Add Key
          </Button>
        </div>

        {/* Security Notice */}
        <Card className="mb-6 bg-amber-500/5 border-amber-500/20">
          <CardContent className="py-4">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <Shield className="inline-block mr-2 h-4 w-4" />
              <strong>Security Note:</strong> Keys are stored in your Supabase database. For maximum security, consider using a dedicated password manager for highly sensitive production keys.
            </p>
          </CardContent>
        </Card>

        {/* Keys List */}
        {filteredKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Key className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No keys found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try a different search term.'
                : 'Add your first API key to get started.'}
            </p>
            {!searchQuery && (
              <Button onClick={openNewForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Key
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Favorites first */}
            {filteredKeys
              .sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0))
              .map((key) => (
                <Card key={key.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side - Key info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{key.name}</h3>
                          {key.is_favorite && (
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {key.service && (
                            <Badge variant="secondary" className="text-xs">
                              {key.service}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn('text-xs', environmentColors[key.environment])}
                          >
                            {key.environment}
                          </Badge>
                        </div>

                        {/* Key value display */}
                        <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
                          <code className="flex-1 text-sm font-mono truncate">
                            {visibleKeys.has(key.id) ? key.key_value : maskKey(key.key_value)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => toggleKeyVisibility(key.id)}
                          >
                            {visibleKeys.has(key.id) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => copyKey(key.id, key.key_value)}
                          >
                            {copiedId === key.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {key.notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {key.notes}
                          </p>
                        )}
                      </div>

                      {/* Right side - Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleFavorite(key.id)}>
                            {key.is_favorite ? (
                              <>
                                <StarOff className="mr-2 h-4 w-4" />
                                Remove Favorite
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-4 w-4" />
                                Add to Favorites
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditForm(key)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteKey(key)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Add/Edit Key Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingKey ? 'Edit Key' : 'Add New Key'}
            </DialogTitle>
            <DialogDescription>
              {editingKey
                ? 'Update your API key details.'
                : 'Store a new API key or secret in your keychain.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., OpenAI API Key"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Key / Secret *</Label>
              <Input
                id="key"
                placeholder="sk-..."
                value={formKeyValue}
                onChange={(e) => setFormKeyValue(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select value={formService} onValueChange={setFormService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {commonServices.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select
                  value={formEnvironment}
                  onValueChange={(v) => setFormEnvironment(v as KeyEnvironment)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this key..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingKey ? 'Save Changes' : 'Add Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKey} onOpenChange={() => setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteKey?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
