'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ProjectPayload, ProjectRecord, ProjectTypeRecord } from '@/types/projects';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AssetUploader from '@/app/admin/components/AssetUploader';
import ProjectPreview from '@/app/admin/components/ProjectPreview';

const RichTextEditor = dynamic(() => import('@/app/admin/components/RichTextEditor').then((mod) => ({ default: mod.RichTextEditor })), {
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <p className="text-sm font-medium">Process & context</p>
      <div className="h-40 rounded-lg border bg-muted/30" />
    </div>
  ),
});

type Props = {
  project: ProjectPayload | null;
  projectTypes: ProjectTypeRecord[];
  isCreating: boolean;
  onSaved: (project: ProjectRecord) => void;
  onDeleted: (projectId: string) => void;
};

type StatusState = { type: 'idle' | 'saving' | 'success' | 'error'; message: string };

const baseStatus: StatusState = { type: 'idle', message: '' };

function normalizePayload(project: ProjectPayload | null): ProjectPayload {
  if (!project) {
    return {
      name: '',
      slug: '',
      description: '',
      featured_image_url: '',
      images_urls: [],
      process_image_urls: [],
      process_images_label: '',
      process_and_context_html: '',
      year: '',
      linked_document_url: '',
      video_url: '',
      fallback_writing_url: '',
      project_type_id: null,
      draft: true,
      archived: false,
    };
  }

  return {
    ...project,
    name: project.name ?? '',
    slug: project.slug ?? '',
    description: project.description ?? '',
    featured_image_url: project.featured_image_url ?? '',
    process_images_label: project.process_images_label ?? '',
    process_and_context_html: project.process_and_context_html ?? '',
    year: project.year ?? '',
    linked_document_url: project.linked_document_url ?? '',
    video_url: project.video_url ?? '',
    fallback_writing_url: project.fallback_writing_url ?? '',
    images_urls: [...(project.images_urls ?? [])],
    process_image_urls: [...(project.process_image_urls ?? [])],
  };
}

async function saveProject(payload: ProjectPayload): Promise<ProjectRecord> {
  const hasId = Boolean(payload.id);
  const endpoint = hasId ? `/api/admin/projects/${payload.id}` : '/api/admin/projects';
  const method = hasId ? 'PUT' : 'POST';
  const response = await fetch(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to save project');
  }
  return data as ProjectRecord;
}

async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/admin/projects/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error ?? 'Unable to delete project');
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

export function ProjectEditor({ project, projectTypes, isCreating, onSaved, onDeleted }: Props) {
  const [formState, setFormState] = useState<ProjectPayload>(normalizePayload(project));
  const [status, setStatus] = useState<StatusState>(baseStatus);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isEditingExisting = Boolean(project?.id);

  useEffect(() => {
    setFormState(normalizePayload(project));
    setStatus(baseStatus);
  }, [project]);

  const projectTypeLookup = useMemo(() => {
    const map = new Map<string, ProjectTypeRecord>();
    projectTypes.forEach((type) => {
      map.set(type.id, type);
    });
    return map;
  }, [projectTypes]);

  const selectedTypeName = useMemo(() => {
    if (!formState.project_type_id) return 'Unassigned';
    return projectTypeLookup.get(formState.project_type_id)?.name ?? 'Unassigned';
  }, [formState.project_type_id, projectTypeLookup]);

  const updateField = <K extends keyof ProjectPayload>(field: K, value: ProjectPayload[K]) => {
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
      const payload: ProjectPayload = {
        ...formState,
        slug: formState.slug.trim(),
        name: formState.name?.trim() ?? '',
        project_type_id: formState.project_type_id || null,
        images_urls: (formState.images_urls ?? []).filter((url) => url.trim() !== ''),
        process_image_urls: (formState.process_image_urls ?? []).filter((url) => url.trim() !== ''),
        process_images_label: formState.process_images_label?.trim() ?? '',
        featured_image_url: formState.featured_image_url?.trim() ?? '',
        linked_document_url: formState.linked_document_url?.trim() ?? '',
        video_url: formState.video_url?.trim() ?? '',
        fallback_writing_url: formState.fallback_writing_url?.trim() ?? '',
        year: formState.year?.trim() ?? '',
      };
      const saved = await saveProject(payload);
      onSaved(saved);
      setFormState(normalizePayload(saved));
      setStatus({ type: 'success', message: 'Saved!' });
      toast.success('Project saved');
      const typeSlug = saved.project_type_id ? projectTypeLookup.get(saved.project_type_id)?.slug : null;
      const paths = new Set<string>(['/work', `/work/${saved.slug}`]);
      if (typeSlug) {
        paths.add('/project-types');
        paths.add(`/project-types/${typeSlug}`);
      }
      await revalidateContent(Array.from(paths));
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong.',
      });
      toast.error(error instanceof Error ? error.message : 'Unable to save project');
    }
  };

  const handleDelete = async () => {
    if (!formState.id) return;
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setStatus({ type: 'saving', message: 'Deleting…' });
    try {
      await deleteProject(formState.id);
      onDeleted(formState.id);
      toast.success('Project deleted');
      setStatus({ type: 'success', message: 'Deleted.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete project.';
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
              <CardTitle>{isCreating ? 'Create project' : formState.name || 'Edit project'}</CardTitle>
              <CardDescription>
                {formState.slug ? `/${formState.slug}` : 'Add a slug to publish this project.'}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={formState.draft ? 'secondary' : 'default'}>
                {formState.draft ? 'Draft' : 'Published'}
              </Badge>
              {formState.archived ? <Badge variant="outline">Archived</Badge> : null}
              <Badge variant="outline">{selectedTypeName}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-10">
          <section className="space-y-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-muted-foreground">Overview</p>
              <p className="text-sm text-muted-foreground">Core metadata for the project card.</p>
            </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Name</Label>
                  <Input
                    id="project-name"
                    value={formState.name ?? ''}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="Project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-slug">Slug *</Label>
                  <Input
                    id="project-slug"
                    value={formState.slug ?? ''}
                    onChange={(event) => updateField('slug', event.target.value)}
                    placeholder="project-slug"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formState.description ?? ''}
                  onChange={(event) => updateField('description', event.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Project type</Label>
                  <Select
                    value={formState.project_type_id ?? 'unassigned'}
                    onValueChange={(value) => updateField('project_type_id', value === 'unassigned' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name ?? type.slug}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    value={formState.year ?? ''}
                    onChange={(event) => updateField('year', event.target.value)}
                  />
                </div>
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
                    <p className="text-xs text-muted-foreground">Hide from featured listings</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Video URL / embed</Label>
                <Input
                  type="url"
                  value={formState.video_url ?? ''}
                  placeholder="https://player..."
                  onChange={(event) => updateField('video_url', event.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Provide a direct video link or embed code. When present, the video replaces the featured image on detail pages.
                </p>
              </div>
          </section>
          <section className="space-y-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-muted-foreground">Media</p>
              <p className="text-sm text-muted-foreground">Upload imagery and supporting assets.</p>
            </div>
              <AssetUploader
                slug={formState.slug ?? 'new-project'}
                label="Featured image"
                description="Primary hero image used on detail pages and cards."
                folder="featured"
                files={formState.featured_image_url ? [formState.featured_image_url] : []}
                maxFiles={1}
                onFilesChange={(urls) => updateField('featured_image_url', urls[0] ?? '')}
              />
              <AssetUploader
                slug={formState.slug ?? 'new-project'}
                label="Final gallery"
                description="Drop full-bleed images that appear in the project gallery."
                folder="gallery"
                files={formState.images_urls ?? []}
                onFilesChange={(urls) => updateField('images_urls', urls)}
              />
              <AssetUploader
                slug={formState.slug ?? 'new-project'}
                label="Process gallery"
                description="Upload sketches or behind-the-scenes shots."
                folder="process"
                files={formState.process_image_urls ?? []}
                onFilesChange={(urls) => updateField('process_image_urls', urls)}
              />
              <div className="space-y-2">
                <Label>Process images label</Label>
                <Input
                  value={formState.process_images_label ?? ''}
                  onChange={(event) => updateField('process_images_label', event.target.value)}
                />
              </div>
              <RichTextEditor
                label="Process & context"
                description="Rich text shown in the process section of the public case study."
                value={formState.process_and_context_html ?? ''}
                onChange={(html) => updateField('process_and_context_html', html)}
                placeholder="Share steps, insights, or milestones…"
              />
          </section>
          <section className="space-y-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-muted-foreground">Links & context</p>
              <p className="text-sm text-muted-foreground">Optional embeds and external references.</p>
            </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Linked document URL</Label>
                  <Input
                    type="url"
                    value={formState.linked_document_url ?? ''}
                    onChange={(event) => updateField('linked_document_url', event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fallback writing URL</Label>
                <Input
                  type="url"
                  value={formState.fallback_writing_url ?? ''}
                  onChange={(event) => updateField('fallback_writing_url', event.target.value)}
                />
              </div>
          </section>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {status.message ? status.message : isCreating ? 'Fill the form to create a project.' : ''}
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Live preview</DialogTitle>
                </DialogHeader>
                <ProjectPreview project={formState} />
              </DialogContent>
            </Dialog>
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


