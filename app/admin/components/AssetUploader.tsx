'use client';

import { useMemo, useRef, useState } from 'react';
import { CloudUpload, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageWithSupabaseFallback from '@/app/components/ImageWithSupabaseFallback';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type UploadTarget = 'featured' | 'final' | 'process';

type Props = {
  slug: string;
  label: string;
  description?: string;
  folder?: string;
  files: string[];
  maxFiles?: number;
  onFilesChange: (urls: string[]) => void;
};

const uploadBucket = process.env.NEXT_PUBLIC_ADMIN_UPLOAD_BUCKET || 'projects';
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export default function AssetUploader({
  slug,
  label,
  description,
  folder,
  files,
  maxFiles,
  onFilesChange,
}: Props) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const prefix = useMemo(() => {
    const safeSlug = slug?.trim() || 'new-project';
    return ['projects', safeSlug, folder].filter(Boolean).join('/');
  }, [folder, slug]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    let nextFiles = [...files];
    if (maxFiles && nextFiles.length >= maxFiles) {
      setError(`Maximum of ${maxFiles} files reached.`);
      return;
    }
    setIsUploading(true);
    setError('');

    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) {
        const message = `${file.name} is not an image.`;
        setError(message);
        toast.error(message);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        const message = `${file.name} exceeds the 10MB limit.`;
        setError(message);
        toast.error(message);
        continue;
      }
      if (maxFiles && nextFiles.length >= maxFiles) {
        break;
      }

      setStatus(`Uploading ${file.name}…`);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', uploadBucket);
        formData.append('prefix', prefix);
        const response = await fetch('/api/admin/uploads', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error ?? 'Upload failed');
        }
        nextFiles = [...nextFiles, data.publicUrl];
        onFilesChange(nextFiles);
        setStatus(`Uploaded ${file.name}`);
        toast.success(`Uploaded ${file.name}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        toast.error(message);
        break;
      }
    }

    setIsUploading(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const next = files.filter((_, idx) => idx !== index);
    onFilesChange(next);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div>
        <p className="font-medium">{label}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {maxFiles === 1 ? (
          <p className="text-xs font-medium text-muted-foreground">Only one image is allowed. Uploading a new file replaces the current one.</p>
        ) : null}
      </div>
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors',
          isUploading && 'border-primary bg-primary/5',
          maxFiles && files.length >= maxFiles ? 'opacity-60' : ''
        )}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <CloudUpload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {maxFiles === 1
            ? 'Upload replaces the existing image (only one featured image is allowed).'
            : 'Drop images or browse'}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || (maxFiles ? files.length >= maxFiles : false)}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            'Browse files'
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple={!(maxFiles === 1)}
          accept="image/*"
          onChange={(event) => handleFiles(event.target.files)}
          className="hidden"
        />
      </div>
      {files.length > 0 ? (
        <div className={cn('grid gap-3', maxFiles === 1 ? '' : 'md:grid-cols-2')}>
          {files.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative overflow-hidden rounded-lg border bg-background"
            >
              <ImageWithSupabaseFallback
                src={url}
                alt={`${label} ${index + 1}`}
                className="h-32 w-full object-cover"
                pixelate={false}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 bg-background/80"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No files yet.</p>
      )}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

