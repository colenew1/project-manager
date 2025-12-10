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
  X,
  ChevronDown,
  ChevronUp,
  Folder,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { KeychainGroup, KeyEnvironment, Project } from '@/types';
import { useProjects } from '@/hooks/use-projects';

// Common services for quick selection
const commonServices = [
  'Supabase',
  'OpenAI',
  'Anthropic',
  'Stripe',
  'AWS',
  'Google Cloud',
  'Firebase',
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

interface FormEntry {
  label: string;
  value: string;
}

export default function KeychainPage() {
  // Fetch projects from Supabase
  const { projects = [] } = useProjects();

  // Local state for keychain groups (will connect to Supabase later)
  const [groups, setGroups] = useState<KeychainGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleEntries, setVisibleEntries] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<KeychainGroup | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<KeychainGroup | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formService, setFormService] = useState('');
  const [formEnvironment, setFormEnvironment] = useState<KeyEnvironment>('production');
  const [formNotes, setFormNotes] = useState('');
  const [formEntries, setFormEntries] = useState<FormEntry[]>([{ label: '', value: '' }]);
  const [formProjectIds, setFormProjectIds] = useState<string[]>([]);

  // Filter groups
  const filteredGroups = groups.filter((group) => {
    if (serviceFilter !== 'all' && group.service !== serviceFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        group.name.toLowerCase().includes(query) ||
        group.service?.toLowerCase().includes(query) ||
        group.notes?.toLowerCase().includes(query) ||
        group.entries?.some(e => e.label.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Get unique services from groups
  const usedServices = [...new Set(groups.map((g) => g.service).filter(Boolean))];

  const copyValue = async (entryId: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(entryId);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEntryVisibility = (entryId: string) => {
    setVisibleEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const maskValue = (value: string) => {
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••••••' + value.slice(-4);
  };

  const toggleFavorite = (id: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, is_favorite: !g.is_favorite } : g))
    );
  };

  const openEditForm = (group: KeychainGroup) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormService(group.service || '');
    setFormEnvironment(group.environment);
    setFormNotes(group.notes || '');
    setFormEntries(group.entries?.map(e => ({ label: e.label, value: e.value })) || [{ label: '', value: '' }]);
    setFormProjectIds(group.projects?.map(p => p.id) || []);
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingGroup(null);
    setFormName('');
    setFormService('');
    setFormEnvironment('production');
    setFormNotes('');
    setFormEntries([{ label: '', value: '' }]);
    setFormProjectIds([]);
    setIsFormOpen(true);
  };

  const addEntry = () => {
    setFormEntries([...formEntries, { label: '', value: '' }]);
  };

  const removeEntry = (index: number) => {
    if (formEntries.length > 1) {
      setFormEntries(formEntries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: 'label' | 'value', value: string) => {
    setFormEntries(formEntries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const toggleProjectLink = (projectId: string) => {
    setFormProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error('Name is required');
      return;
    }

    const validEntries = formEntries.filter(e => e.label.trim() && e.value.trim());
    if (validEntries.length === 0) {
      toast.error('At least one key-value pair is required');
      return;
    }

    const linkedProjects = projects.filter(p => formProjectIds.includes(p.id));

    if (editingGroup) {
      // Update existing
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroup.id
            ? {
                ...g,
                name: formName,
                service: formService || null,
                environment: formEnvironment,
                notes: formNotes || null,
                entries: validEntries.map((e, i) => ({
                  id: `${editingGroup.id}-${i}`,
                  group_id: editingGroup.id,
                  label: e.label,
                  value: e.value,
                  created_at: new Date().toISOString(),
                })),
                projects: linkedProjects,
                updated_at: new Date().toISOString(),
              }
            : g
        )
      );
      toast.success('Keychain group updated');
    } else {
      // Create new
      const newId = Math.random().toString(36).slice(2);
      const newGroup: KeychainGroup = {
        id: newId,
        user_id: '1',
        name: formName,
        service: formService || null,
        environment: formEnvironment,
        notes: formNotes || null,
        is_favorite: false,
        entries: validEntries.map((e, i) => ({
          id: `${newId}-${i}`,
          group_id: newId,
          label: e.label,
          value: e.value,
          created_at: new Date().toISOString(),
        })),
        projects: linkedProjects,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setGroups((prev) => [newGroup, ...prev]);
      setExpandedGroups(prev => new Set([...prev, newId]));
      toast.success('Keychain group created');
    }

    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteGroup) {
      setGroups((prev) => prev.filter((g) => g.id !== deleteGroup.id));
      toast.success('Keychain group deleted');
      setDeleteGroup(null);
    }
  };

  return (
    <>
      <Header title="Keychain" />

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
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
            Add Keys
          </Button>
        </div>

        {/* Security Notice */}
        <Card className="mb-6 bg-amber-500/5 border-amber-500/20">
          <CardContent className="py-3">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <Shield className="inline-block mr-2 h-4 w-4" />
              <strong>Security:</strong> Keys are stored in your Supabase database with row-level security.
            </p>
          </CardContent>
        </Card>

        {/* Groups List */}
        {filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Key className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No keys found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try a different search term.'
                : 'Add your first API keys to get started.'}
            </p>
            {!searchQuery && (
              <Button onClick={openNewForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Keys
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups
              .sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0))
              .map((group) => (
                <Card key={group.id} className="overflow-hidden">
                  <Collapsible
                    open={expandedGroups.has(group.id)}
                    onOpenChange={() => toggleGroupExpanded(group.id)}
                  >
                    <CardHeader className="p-4 pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          {expandedGroups.has(group.id) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{group.name}</h3>
                              {group.is_favorite && (
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {group.service && (
                                <Badge variant="secondary" className="text-xs">
                                  {group.service}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={cn('text-xs', environmentColors[group.environment])}
                              >
                                {group.environment}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {group.entries?.length || 0} key{(group.entries?.length || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleFavorite(group.id)}>
                              {group.is_favorite ? (
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
                            <DropdownMenuItem onClick={() => openEditForm(group)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteGroup(group)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Linked Projects */}
                      {group.projects && group.projects.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 ml-6">
                          <Folder className="h-3 w-3 text-muted-foreground" />
                          <div className="flex flex-wrap gap-1">
                            {group.projects.map((project) => (
                              <Badge
                                key={project.id}
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: `${project.color}60`,
                                  color: project.color,
                                }}
                              >
                                {project.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="p-4 pt-3">
                        {/* Entries */}
                        <div className="space-y-2">
                          {group.entries?.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center gap-2 bg-muted rounded-lg p-2"
                            >
                              <code className="text-xs font-mono text-muted-foreground min-w-[140px] truncate">
                                {entry.label}
                              </code>
                              <code className="flex-1 text-sm font-mono truncate">
                                {visibleEntries.has(entry.id) ? entry.value : maskValue(entry.value)}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={() => toggleEntryVisibility(entry.id)}
                              >
                                {visibleEntries.has(entry.id) ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={() => copyValue(entry.id, entry.value)}
                              >
                                {copiedId === entry.id ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>

                        {group.notes && (
                          <p className="mt-3 text-sm text-muted-foreground">
                            {group.notes}
                          </p>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Add/Edit Group Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Edit Keys' : 'Add New Keys'}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? 'Update your API keys and settings.'
                : 'Add a group of related API keys (e.g., all Supabase keys for a project).'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Supabase - Project Manager"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
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

            {/* Key-Value Entries */}
            <div className="space-y-2">
              <Label>Keys *</Label>
              <div className="space-y-2">
                {formEntries.map((entry, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="VARIABLE_NAME"
                      value={entry.label}
                      onChange={(e) => updateEntry(index, 'label', e.target.value)}
                      className="w-[140px] font-mono text-sm"
                    />
                    <Input
                      placeholder="Value"
                      value={entry.value}
                      onChange={(e) => updateEntry(index, 'value', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                    {formEntries.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEntry(index)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEntry}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Another Key
              </Button>
            </div>

            {/* Link to Projects */}
            <div className="space-y-2">
              <Label>Link to Projects</Label>
              <div className="space-y-2 max-h-[150px] overflow-y-auto rounded-lg border border-border p-2">
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">No projects available</p>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={formProjectIds.includes(project.id)}
                        onCheckedChange={() => toggleProjectLink(project.id)}
                      />
                      <label
                        htmlFor={`project-${project.id}`}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Select projects that use these keys
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
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
              {editingGroup ? 'Save Changes' : 'Add Keys'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGroup} onOpenChange={() => setDeleteGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Keychain Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteGroup?.name}&quot; and all its keys? This action cannot be undone.
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
