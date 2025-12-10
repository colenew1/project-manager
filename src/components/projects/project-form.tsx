'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Plus, X, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Project, ProjectStatus, ProjectCategory } from '@/types';

interface AdditionalLink {
  label: string;
  url: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  mac_path: string;
  pc_path: string;
  github_url: string;
  github_clone: string;
  live_url: string;
  status: ProjectStatus;
  categories: ProjectCategory[];
  color: string;
  icon: string;
  additional_links: AdditionalLink[];
}

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  project?: Project;
  mode: 'create' | 'edit';
}

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const colorOptions = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

// Base paths for auto-completion
const MAC_BASE_PATH = '/Users/colenewman/Desktop/Code-Projects/';
const PC_BASE_PATH = 'C:\\Users\\colenewman\\Code-Projects\\';

const categoryOptions: { value: ProjectCategory; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'customer_success', label: 'Customer Success' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product' },
  { value: 'design', label: 'Design' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'HR' },
  { value: 'other', label: 'Other' },
];

export function ProjectForm({ open, onClose, onSubmit, project, mode }: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(project?.color || colorOptions[0]);
  const [selectedCategories, setSelectedCategories] = useState<ProjectCategory[]>(
    project?.categories || []
  );
  const [additionalLinks, setAdditionalLinks] = useState<AdditionalLink[]>(
    project?.links?.map((l) => ({ label: l.label, url: l.url })) || []
  );
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      mac_path: project?.mac_path || '',
      pc_path: project?.pc_path || '',
      github_url: project?.github_url || '',
      github_clone: project?.github_clone || '',
      live_url: project?.live_url || '',
      status: project?.status || 'idea',
      categories: project?.categories || [],
      color: project?.color || colorOptions[0],
      icon: project?.icon || '',
      additional_links: [],
    },
  });

  const status = watch('status');

  // Reset form when project changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: project?.name || '',
        description: project?.description || '',
        mac_path: project?.mac_path || '',
        pc_path: project?.pc_path || '',
        github_url: project?.github_url || '',
        github_clone: project?.github_clone || '',
        live_url: project?.live_url || '',
        status: project?.status || 'idea',
        categories: project?.categories || [],
        color: project?.color || colorOptions[0],
        icon: project?.icon || '',
        additional_links: [],
      });
      setSelectedColor(project?.color || colorOptions[0]);
      setSelectedCategories(project?.categories || []);
      setAdditionalLinks(project?.links?.map((l) => ({ label: l.label, url: l.url })) || []);
    }
  }, [open, project, reset]);

  const toggleCategory = (category: ProjectCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const addLink = () => {
    console.log('addLink called with:', { newLinkLabel, newLinkUrl });
    if (newLinkLabel.trim() && newLinkUrl.trim()) {
      const newLinks = [...additionalLinks, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }];
      console.log('Setting additionalLinks to:', newLinks);
      setAdditionalLinks(newLinks);
      setNewLinkLabel('');
      setNewLinkUrl('');
    }
  };

  const removeLink = (index: number) => {
    setAdditionalLinks(additionalLinks.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    try {
      console.log('Form submitting with additionalLinks:', additionalLinks);
      const submitData = { ...data, color: selectedColor, categories: selectedCategories, additional_links: additionalLinks };
      console.log('Full submit data:', submitData);
      await onSubmit(submitData);
      reset();
      setSelectedCategories([]);
      setAdditionalLinks([]);
      onClose();
    } catch (error) {
      console.error('Error submitting project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Project' : 'Edit Project'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new project to track your work.'
              : 'Update your project details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name & Icon */}
          <div className="grid gap-4 sm:grid-cols-[1fr_80px]">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome Project"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                placeholder=""
                maxLength={2}
                className="text-center text-xl"
                {...register('icon')}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What is this project about?"
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Status & Color */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as ProjectStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-primary'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories / Departments</Label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleCategory(option.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    selectedCategories.includes(option.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select one or more categories this project belongs to
            </p>
          </div>

          {/* Paths */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h4 className="font-medium">Directory Paths</h4>
            <p className="text-xs text-muted-foreground">
              Just type the folder name (e.g., "amp2025")
            </p>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="mac_folder">Mac Folder</Label>
                <Input
                  id="mac_folder"
                  placeholder="my-project"
                  defaultValue={project?.mac_path?.replace(MAC_BASE_PATH, '') || ''}
                  onChange={(e) => {
                    const folder = e.target.value.trim();
                    if (folder) {
                      setValue('mac_path', MAC_BASE_PATH + folder);
                    } else {
                      setValue('mac_path', '');
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground truncate">
                  {MAC_BASE_PATH}
                </p>
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="pc_folder">PC Folder</Label>
                <Input
                  id="pc_folder"
                  placeholder="my-project"
                  defaultValue={project?.pc_path?.replace(PC_BASE_PATH, '') || ''}
                  onChange={(e) => {
                    const folder = e.target.value.trim();
                    if (folder) {
                      setValue('pc_path', PC_BASE_PATH + folder);
                    } else {
                      setValue('pc_path', '');
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground truncate">
                  {PC_BASE_PATH}
                </p>
              </div>
            </div>
          </div>

          {/* Live URL */}
          <div className="space-y-2">
            <Label htmlFor="live_url">Live URL</Label>
            <Input
              id="live_url"
              placeholder="https://myproject.vercel.app"
              {...register('live_url')}
            />
            <p className="text-xs text-muted-foreground">
              The deployed/production URL for this project
            </p>
          </div>

          {/* GitHub Links */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h4 className="font-medium">GitHub Repository</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="github_url">Repository URL</Label>
                <Input
                  id="github_url"
                  placeholder="https://github.com/user/repo"
                  {...register('github_url')}
                />
                <p className="text-xs text-muted-foreground">Link to view the repo</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="github_clone">Clone URL</Label>
                <Input
                  id="github_clone"
                  placeholder="git@github.com:user/repo.git"
                  {...register('github_clone')}
                />
                <p className="text-xs text-muted-foreground">SSH or HTTPS for cloning</p>
              </div>
            </div>
          </div>

          {/* Additional Links */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h4 className="font-medium">Additional Links</h4>

            {/* Existing links */}
            {additionalLinks.length > 0 && (
              <div className="space-y-2">
                {additionalLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium min-w-[80px]">{link.label}:</span>
                    <span className="text-muted-foreground truncate flex-1">{link.url}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removeLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new link */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Label (e.g., Docs)"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  className="w-24 flex-shrink-0"
                />
                <Input
                  placeholder="URL"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="flex-1 min-w-0"
                />
              </div>
              <Button
                type="button"
                variant="default"
                onClick={addLink}
                disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add links to docs, Figma, Notion, or any other resources
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Project' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
