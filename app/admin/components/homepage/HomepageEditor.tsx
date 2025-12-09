'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import AssetUploader from '@/app/admin/components/AssetUploader';
import type { HeroContent } from '@/lib/domain/hero-content/types';
import type { FolderLink } from '@/lib/domain/folder-links/types';

type HomepageEditorProps = {
  initialHeroContent: HeroContent | null;
  initialFolderLinks: FolderLink[];
};

export function HomepageEditor({ initialHeroContent, initialFolderLinks }: HomepageEditorProps) {
  const [heroContent, setHeroContent] = useState(initialHeroContent);
  const [folderLinks, setFolderLinks] = useState(initialFolderLinks);
  const [saving, setSaving] = useState(false);

  const handleSaveHero = async () => {
    if (!heroContent) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/hero-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heroContent),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('Hero content saved');
    } catch {
      toast.error('Failed to save hero content');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFolderLinks = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/folder-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderLinks),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('Folder links saved');
    } catch {
      toast.error('Failed to save folder links');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = () => {
    const newLink: FolderLink = {
      id: `temp-${Date.now()}`,
      label: 'New Link',
      icon: '',
      href: '/',
      external: false,
      displayOrder: folderLinks.length + 1,
    };
    setFolderLinks([...folderLinks, newLink]);
  };

  const handleDeleteLink = (id: string) => {
    setFolderLinks(folderLinks.filter(link => link.id !== id));
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...folderLinks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newLinks.length) return;
    
    [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
    
    // Update display orders
    newLinks.forEach((link, idx) => {
      link.displayOrder = idx + 1;
    });
    
    setFolderLinks(newLinks);
  };

  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">Homepage Settings</h1>
        <p className="text-muted-foreground">Manage hero content and folder links</p>
      </div>

      {/* Hero Content Section */}
      <Card>
        <CardHeader>
          <CardTitle>Above-the-Fold Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {heroContent && (
            <>
              <div>
                <Label htmlFor="windowTitle">Window Title</Label>
                <Input
                  id="windowTitle"
                  value={heroContent.windowTitle}
                  onChange={(e) => setHeroContent({ ...heroContent, windowTitle: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="heroText">Hero Text</Label>
                <Textarea
                  id="heroText"
                  rows={4}
                  value={heroContent.heroText}
                  onChange={(e) => setHeroContent({ ...heroContent, heroText: e.target.value })}
                />
              </div>

              <div>
                <AssetUploader
                  slug="homepage"
                  folder="hero"
                  label="Hero Image"
                  description="The main image displayed in the hero window"
                  files={heroContent.heroImageUrl ? [heroContent.heroImageUrl] : []}
                  maxFiles={1}
                  onFilesChange={(urls) => setHeroContent({ ...heroContent, heroImageUrl: urls[0] ?? '' })}
                />
              </div>

              <div>
                <Label htmlFor="footerLinkText">Footer Link Text</Label>
                <Input
                  id="footerLinkText"
                  value={heroContent.footerLinkText ?? ''}
                  onChange={(e) => setHeroContent({ ...heroContent, footerLinkText: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="footerLinkHref">Footer Link URL</Label>
                <Input
                  id="footerLinkHref"
                  value={heroContent.footerLinkHref ?? ''}
                  onChange={(e) => setHeroContent({ ...heroContent, footerLinkHref: e.target.value })}
                />
              </div>

              <Button onClick={handleSaveHero} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                Save Hero Content
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Folder Links Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Folder Links ({folderLinks.length})</CardTitle>
          <Button onClick={handleAddLink} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Link
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {folderLinks.map((link, index) => (
            <div key={link.id} className="flex gap-2 items-start p-4 border rounded-lg">
              <div className="flex flex-col gap-1 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMoveLink(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMoveLink(index, 'down')}
                  disabled={index === folderLinks.length - 1}
                >
                  ↓
                </Button>
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={link.label}
                    onChange={(e) => {
                      const newLinks = [...folderLinks];
                      newLinks[index].label = e.target.value;
                      setFolderLinks(newLinks);
                    }}
                  />
                </div>
                
                <div>
                  <Label>Icon (optional)</Label>
                  <Input
                    value={link.icon}
                    onChange={(e) => {
                      const newLinks = [...folderLinks];
                      newLinks[index].icon = e.target.value;
                      setFolderLinks(newLinks);
                    }}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>URL</Label>
                  <Input
                    value={link.href}
                    onChange={(e) => {
                      const newLinks = [...folderLinks];
                      newLinks[index].href = e.target.value;
                      setFolderLinks(newLinks);
                    }}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`external-${link.id}`}
                    checked={link.external}
                    onChange={(e) => {
                      const newLinks = [...folderLinks];
                      newLinks[index].external = e.target.checked;
                      setFolderLinks(newLinks);
                    }}
                  />
                  <Label htmlFor={`external-${link.id}`}>External link</Label>
                </div>
              </div>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteLink(link.id)}
                className="mt-6"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button onClick={handleSaveFolderLinks} disabled={saving} className="gap-2 w-full">
            <Save className="h-4 w-4" />
            Save All Folder Links
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

