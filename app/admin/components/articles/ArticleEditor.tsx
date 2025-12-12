'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ArticlePayload, ArticleRecord } from '@/types/projects';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AssetUploader from '@/app/admin/components/AssetUploader';

type Props = {
  article: ArticlePayload | null;
  isCreating: boolean;
  onSaved: (article: ArticleRecord) => void;
  onDeleted: (articleId: string) => void;
};

type StatusState = { type: 'idle' | 'saving' | 'success' | 'error'; message: string };

const baseStatus: StatusState = { type: 'idle', message: '' };

function normalizePayload(article: ArticlePayload | null): ArticlePayload {
  if (!article) {
    return {
      name: '',
      slug: '',
      title: '',
      publication: '',
      date_published: null,
      featured_image_url: null,
      url: '',
      draft: true,
      archived: false,
    };
  }

  return {
    ...article,
    name: article.name ?? '',
    slug: article.slug ?? '',
    title: article.title ?? '',
    publication: article.publication ?? '',
    url: article.url ?? '',
  };
}

async function saveArticle(payload: ArticlePayload): Promise<ArticleRecord> {
  const hasId = Boolean(payload.id);
  const endpoint = hasId ? `/api/admin/articles/${payload.id}` : '/api/admin/articles';
  const method = hasId ? 'PUT' : 'POST';
  const response = await fetch(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to save article');
  }
  return data as ArticleRecord;
}

async function deleteArticle(id: string): Promise<void> {
  const response = await fetch(`/api/admin/articles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error ?? 'Unable to delete article');
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

export function ArticleEditor({ article, isCreating, onSaved, onDeleted }: Props) {
  const [formState, setFormState] = useState<ArticlePayload>(normalizePayload(article));
  const [status, setStatus] = useState<StatusState>(baseStatus);
  const isEditingExisting = Boolean(article?.id);

  useEffect(() => {
    setFormState(normalizePayload(article));
    setStatus(baseStatus);
  }, [article]);

  const updateField = <K extends keyof ArticlePayload>(field: K, value: ArticlePayload[K]) => {
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
      const payload: ArticlePayload = {
        ...formState,
        slug: formState.slug.trim(),
        name: formState.name?.trim() ?? '',
        title: formState.title?.trim() ?? '',
        publication: formState.publication?.trim() ?? '',
        url: formState.url?.trim() ?? '',
        date_published: formState.date_published || null,
        featured_image_url: formState.featured_image_url?.trim() || null,
      };
      const saved = await saveArticle(payload);
      onSaved(saved);
      setFormState(normalizePayload(saved));
      setStatus({ type: 'success', message: 'Saved!' });
      toast.success('Article saved');
      const paths = new Set<string>(['/writing']);
      if (saved.slug) {
        paths.add(`/writing/${saved.slug}`);
      }
      await revalidateContent(Array.from(paths));
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong.',
      });
      toast.error(error instanceof Error ? error.message : 'Unable to save article');
    }
  };

  const handleDelete = async () => {
    if (!formState.id) return;
    if (!confirm('Delete this article? This cannot be undone.')) return;
    setStatus({ type: 'saving', message: 'Deleting…' });
    try {
      await deleteArticle(formState.id);
      onDeleted(formState.id);
      toast.success('Article deleted');
      setStatus({ type: 'success', message: 'Deleted.' });
      await revalidateContent(['/writing']);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete article.';
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
              <CardTitle>{isCreating ? 'Create article' : formState.title || formState.name || 'Edit article'}</CardTitle>
              <CardDescription>
                {formState.slug ? `/${formState.slug}` : 'Add a slug to publish this article.'}
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
                <Label htmlFor="article-name">Internal Name</Label>
                <Input
                  id="article-name"
                  value={formState.name ?? ''}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Internal reference name"
                />
                <p className="text-xs text-muted-foreground">
                  Optional internal name for admin reference.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-slug">Slug *</Label>
                <Input
                  id="article-slug"
                  value={formState.slug ?? ''}
                  onChange={(event) => updateField('slug', event.target.value)}
                  placeholder="article-slug"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-title">Title</Label>
              <Input
                id="article-title"
                value={formState.title ?? ''}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Article title"
              />
              <p className="text-xs text-muted-foreground">
                The public title displayed for this article.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="article-publication">Publication</Label>
                <Input
                  id="article-publication"
                  value={formState.publication ?? ''}
                  onChange={(event) => updateField('publication', event.target.value)}
                  placeholder="e.g., Medium, Forbes, Personal Blog"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-date">Date Published</Label>
                <Input
                  id="article-date"
                  type="date"
                  value={formState.date_published ?? ''}
                  onChange={(event) => updateField('date_published', event.target.value || null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-url">Article URL</Label>
              <Input
                id="article-url"
                type="url"
                value={formState.url ?? ''}
                onChange={(event) => updateField('url', event.target.value)}
                placeholder="https://example.com/article"
              />
              <p className="text-xs text-muted-foreground">
                External link to the full article.
              </p>
            </div>
            <AssetUploader
              slug={formState.slug || 'new-article'}
              label="Featured Image"
              description="Optional image displayed with the article listing."
              folder="articles"
              files={formState.featured_image_url ? [formState.featured_image_url] : []}
              maxFiles={1}
              onFilesChange={(urls) => updateField('featured_image_url', urls[0] ?? null)}
            />
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
                  <p className="text-xs text-muted-foreground">Hide from public articles listing</p>
                </div>
              </div>
            </div>
          </section>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {status.message ? status.message : isCreating ? 'Fill the form to create an article.' : ''}
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

