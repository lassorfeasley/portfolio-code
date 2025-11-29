'use client';

import { useEffect, useRef, useState } from 'react';
import { CloudUpload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type UploadTarget = 'featured' | 'final' | 'process';

type Props = {
  slug: string;
  onAttach: (url: string, target: UploadTarget) => void;
};

const uploadBucket = process.env.NEXT_PUBLIC_ADMIN_UPLOAD_BUCKET || 'projects';

export default function AssetUploader({ slug, onAttach }: Props) {
  const [target, setTarget] = useState<UploadTarget>('final');
  const [prefix, setPrefix] = useState(`projects/${slug || 'new-project'}`);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) return;
    setPrefix((current) => {
      if (!current || current.startsWith('projects/')) {
        return `projects/${slug}`;
      }
      return current;
    });
  }, [slug]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError('');

    for (const file of Array.from(files)) {
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
        setStatus(`Uploaded ${file.name}`);
        onAttach(data.publicUrl, target);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        break;
      }
    }

    setIsUploading(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="upload-prefix">Save to folder</Label>
          <Input
            id="upload-prefix"
            value={prefix}
            onChange={(event) => setPrefix(event.target.value)}
            placeholder="projects/slug"
          />
        </div>
        <div className="space-y-2">
          <Label>Attach uploaded file to</Label>
          <Select value={target} onValueChange={(value: UploadTarget) => setTarget(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured image</SelectItem>
              <SelectItem value="final">Final gallery</SelectItem>
              <SelectItem value="process">Process gallery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors',
          isUploading && 'border-primary bg-primary/5'
        )}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <CloudUpload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Drop files here or select from your computer</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
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
          multiple
          onChange={(event) => handleFiles(event.target.files)}
          className="hidden"
        />
      </div>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

