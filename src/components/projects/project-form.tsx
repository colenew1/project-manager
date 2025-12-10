'use client';

import { useState } from 'react';
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
import { Project, ProjectStatus } from '@/types';

interface AdditionalLink {
  label: string;
  url: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  mac_path: string;
  pc_path: string;
  github_ssh: string;
  github_https: string;
  status: ProjectStatus;
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

export function ProjectForm({ open, onClose, onSubmit, project, mode }: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(project?.color || colorOptions[0]);
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
      github_ssh: project?.github_ssh || '',
      github_https: project?.github_https || '',
      status: project?.status || 'idea',
      color: project?.color || colorOptions[0],
      icon: project?.icon || '',
      additional_links: [],
    },
  });

  const status = watch('status');

  const addLink = () => {
    if (newLinkLabel.trim() && newLinkUrl.trim()) {
      setAdditionalLinks([...additionalLinks, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }]);
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
      await onSubmit({ ...data, color: selectedColor, additional_links: additionalLinks });
      reset();
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                placeholder="🚀"
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

          {/* Paths */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h4 className="font-medium">Directory Paths</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mac_path">Mac Path</Label>
                <Input
                  id="mac_path"
                  placeholder="~/Projects/my-project"
                  {...register('mac_path')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pc_path">PC Path</Label>
                <Input
                  id="pc_path"
                  placeholder="C:\Projects\my-project"
                  {...register('pc_path')}
                />
              </div>
            </div>
          </div>

          {/* GitHub Links */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h4 className="font-medium">GitHub Repository</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="github_ssh">SSH URL</Label>
                <Input
                  id="github_ssh"
                  placeholder="git@github.com:user/repo.git"
                  {...register('github_ssh')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github_https">HTTPS URL</Label>
                <Input
                  id="github_https"
                  placeholder="https://github.com/user/repo.git"
                  {...register('github_https')}
                />
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
            <div className="flex gap-2">
              <Input
                placeholder="Label (e.g., Docs)"
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                className="w-[120px]"
              />
              <Input
                placeholder="URL"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addLink}
                disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
              >
                <Plus className="h-4 w-4" />
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
