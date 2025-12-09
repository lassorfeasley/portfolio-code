'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ProjectTypePayload, ProjectTypeRecord } from '@/types/projects';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Props = {
  projectType: ProjectTypePayload | null;
  isCreating: boolean;
  onSaved: (projectType: ProjectTypeRecord) => void;
  onDeleted: (projectTypeId: string) => void;
};

type StatusState = { type: 'idle' | 'saving' | 'success' | 'error'; message: string };

const baseStatus: StatusState = { type: 'idle', message: '' };

function normalizePayload(projectType: ProjectTypePayload | null): ProjectTypePayload {
  if (!projectType) {
    return {
      name: '',
      slug: '',
      category: '',
      landing_page_credentials: '',
      draft: true,
      archived: false,
    };
  }

  return {
    ...projectType,
    name: projectType.name ?? '',
    slug: projectType.slug ?? '',
    category: projectType.category ?? '',
    landing_page_credentials: projectType.landing_page_credentials ?? '',
  };
}

async function saveProjectType(payload: ProjectTypePayload): Promise<ProjectTypeRecord> {
  const hasId = Boolean(payload.id);
  const endpoint = hasId ? `/api/admin/project-types/${payload.id}` : '/api/admin/project-types';
  const method = hasId ? 'PUT' : 'POST';
  const response = await fetch(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to save project type');
  }
  return data as ProjectTypeRecord;
}

async function deleteProjectType(id: string): Promise<void> {
  const response = await fetch(`/api/admin/project-types/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error ?? 'Unable to delete project type');
  }
}

async function revalidateContent(paths: string[]) {
  if (!paths.length) return;
  try {
    await fetch('/api/admin/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ paths }),
    });
  } catch (error) {
    console.warn('Failed to revalidate content', error);
  }
}

export function ProjectTypeEditor({ projectType, isCreating, onSaved, onDeleted }: Props) {
  const [formState, setFormState] = useState<ProjectTypePayload>(normalizePayload(projectType));
  const [status, setStatus] = useState<StatusState>(baseStatus);
  const isEditingExisting = Boolean(projectType?.id);

  useEffect(() => {
    setFormState(normalizePayload(projectType));
    setStatus(baseStatus);
  }, [projectType]);

  const updateField = <K extends keyof ProjectTypePayload>(field: K, value: ProjectTypePayload[K]) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.slug.trim()) {
      setStatus({ type: 'error', message: 'Slug is required.' });
      return;
    }
    setStatus({ type: 'saving', message: 'Saving…' });
    try {
      const payload: ProjectTypePayload = {
        ...formState,
        slug: formState.slug.trim(),
        name: formState.name?.trim() ?? '',
        category: formState.category?.trim() ?? '',
        landing_page_credentials: formState.landing_page_credentials?.trim() ?? '',
      };
      const saved = await saveProjectType(payload);
      onSaved(saved);
      setFormState(normalizePayload(saved));
      setStatus({ type: 'success', message: 'Saved!' });
      toast.success('Project type saved');
      const paths = new Set<string>(['/project-types']);
      if (saved.slug) {
        paths.add(`/project-types/${saved.slug}`);
      }
      await revalidateContent(Array.from(paths));
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong.',
      });
      toast.error(error instanceof Error ? error.message : 'Unable to save project type');
    }
  };

  const handleDelete = async () => {
    if (!formState.id) return;
    if (!confirm('Delete this project type? This cannot be undone.')) return;
    setStatus({ type: 'saving', message: 'Deleting…' });
    try {
      await deleteProjectType(formState.id);
      onDeleted(formState.id);
      toast.success('Project type deleted');
      setStatus({ type: 'success', message: 'Deleted.' });
      await revalidateContent(['/project-types']);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete project type.';
      setStatus({ type: 'error', message });
      toast.error(message);
    }
  };

  return (
    <Card className="h-fit">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{isCreating ? 'Create project type' : formState.name || 'Edit project type'}</CardTitle>
              <CardDescription>
                {formState.slug ? `/${formState.slug}` : 'Add a slug to publish this project type.'}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={formState.draft ? 'secondary' : 'default'}>
                {formState.draft ? 'Draft' : 'Published'}
              </Badge>
              {formState.archived ? <Badge variant="outline">Archived</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-type-name">Name</Label>
                <Input
                  id="project-type-name"
                  value={formState.name ?? ''}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Project type name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-type-slug">Slug *</Label>
                <Input
                  id="project-type-slug"
                  value={formState.slug ?? ''}
                  onChange={(event) => updateField('slug', event.target.value)}
                  placeholder="project-type-slug"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-type-category">Category</Label>
              <Input
                id="project-type-category"
                value={formState.category ?? ''}
                onChange={(event) => updateField('category', event.target.value)}
                placeholder="Optional category description"
              />
              <p className="text-sm text-muted-foreground">
                Optional category text shown on the project types index page.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-type-description">Page Description</Label>
              <Textarea
                id="project-type-description"
                value={formState.landing_page_credentials ?? ''}
                onChange={(event) => updateField('landing_page_credentials', event.target.value)}
                placeholder="Description text that appears on this project type's landing page..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                This copy appears at the top of the project type page (e.g., /project-types/innovation).
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="published"
                  checked={!formState.draft}
                  onCheckedChange={(checked) => updateField('draft', !checked)}
                />
                <div>
                  <Label htmlFor="published">Published</Label>
                  <p className="text-xs text-muted-foreground">Visible on the site</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="archived"
                  checked={formState.archived}
                  onCheckedChange={(checked) => updateField('archived', checked)}
                />
                <div>
                  <Label htmlFor="archived">Archived</Label>
                  <p className="text-xs text-muted-foreground">Hide from public project types listing</p>
                </div>
              </div>
            </div>
          </section>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {status.message ? status.message : isCreating ? 'Fill the form to create a project type.' : ''}
          </div>
          <div className="flex flex-wrap gap-2">
            {isEditingExisting ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                disabled={status.type === 'saving'}
                onClick={handleDelete}
              >
                Delete
              </Button>
            ) : null}
            <Button type="submit" disabled={status.type === 'saving'}>
              {status.type === 'saving' ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

