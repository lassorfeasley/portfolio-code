/* eslint-disable @next/next/no-img-element */
'use client';

import ImageWithSupabaseFallback from '@/app/components/ImageWithSupabaseFallback';
import type { ProjectPayload } from '@/types/projects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  project: ProjectPayload;
};

export default function ProjectPreview({ project }: Props) {
  const galleryCount = project.images_urls?.length ?? 0;
  const processCount = project.process_image_urls?.length ?? 0;
  const hasImages = galleryCount > 0;
  const hasProcessImages = processCount > 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{project.name || 'Untitled project'}</CardTitle>
          <CardDescription>{project.slug || 'No slug yet'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.description ? (
            <p className="text-sm">{project.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Add a description to see it here.</p>
          )}
          {project.video_url ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Video embed detected
            </div>
          ) : project.featured_image_url ? (
            <ImageWithSupabaseFallback
              src={project.featured_image_url}
              alt={project.name ?? ''}
              className="w-full rounded-lg border"
              style={{ maxHeight: 260, objectFit: 'cover' }}
              pixelate={false}
            />
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
          <CardDescription>First three images shown</CardDescription>
        </CardHeader>
        <CardContent>
          {hasImages ? (
            <div className="flex flex-wrap gap-3">
              {(project.images_urls ?? []).slice(0, 3).map((url, index) => (
                <img
                  key={url + index}
                  src={url}
                  alt=""
                  className="h-20 w-20 rounded-lg border object-cover"
                />
              ))}
              {galleryCount > 3 ? (
                <span className="text-sm text-muted-foreground">+{galleryCount - 3} more</span>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Uploaded gallery images will appear here.</p>
          )}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Process</CardTitle>
          <CardDescription>{project.process_images_label || 'No label yet'}</CardDescription>
        </CardHeader>
        <CardContent>
          {hasProcessImages ? (
            <div className="flex flex-wrap gap-3">
              {(project.process_image_urls ?? []).slice(0, 4).map((url, index) => (
                <img
                  key={url + index}
                  src={url}
                  alt=""
                  className="h-20 w-20 rounded-lg border object-cover"
                />
              ))}
              {processCount > 4 ? (
                <span className="text-sm text-muted-foreground">+{processCount - 4} more</span>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No process images yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

