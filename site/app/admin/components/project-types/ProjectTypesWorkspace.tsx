'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ProjectTypePayload, ProjectTypeRecord } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { ProjectTypesTable } from './ProjectTypesTable';
import { ProjectTypeEditor } from './ProjectTypeEditor';

type ProjectTypesWorkspaceProps = {
  initialProjectTypes: ProjectTypeRecord[];
};

const emptyProjectType: ProjectTypePayload = {
  name: '',
  slug: '',
  category: '',
  draft: true,
  archived: false,
};

function toPayload(projectType: ProjectTypeRecord | null): ProjectTypePayload {
  if (!projectType) return emptyProjectType;
  return {
    ...projectType,
    name: projectType.name ?? '',
    slug: projectType.slug ?? '',
    category: projectType.category ?? '',
  };
}

export function ProjectTypesWorkspace({ initialProjectTypes }: ProjectTypesWorkspaceProps) {
  const [projectTypes, setProjectTypes] = useState<ProjectTypeRecord[]>(initialProjectTypes);
  const [selectedId, setSelectedId] = useState<string | null>(initialProjectTypes[0]?.id ?? null);
  const [isCreating, setIsCreating] = useState(initialProjectTypes.length === 0);
  const [draftTemplate, setDraftTemplate] = useState<ProjectTypePayload | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>(initialProjectTypes.length === 0 ? 'editor' : 'list');

  const handleSelect = (projectTypeId: string) => {
    setSelectedId(projectTypeId);
    setIsCreating(false);
    setDraftTemplate(null);
    setViewMode('editor');
  };

  const handleCreateNew = () => {
    setSelectedId(null);
    setIsCreating(true);
    setDraftTemplate(emptyProjectType);
    setViewMode('editor');
  };

  const handleDuplicate = (projectType: ProjectTypeRecord) => {
    const duplicated = toPayload(projectType);
    duplicated.id = undefined;
    duplicated.slug = `${duplicated.slug ?? projectType.id}-copy`;
    duplicated.name = duplicated.name ? `${duplicated.name} (copy)` : 'Untitled copy';
    duplicated.draft = true;
    setDraftTemplate(duplicated);
    setSelectedId(null);
    setIsCreating(true);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setIsCreating(false);
    setDraftTemplate(null);
  };

  const handleSaved = (updated: ProjectTypeRecord) => {
    setProjectTypes((current) => {
      const exists = current.some((projectType) => projectType.id === updated.id);
      if (exists) {
        return current.map((projectType) => (projectType.id === updated.id ? updated : projectType));
      }
      return [updated, ...current];
    });
    setSelectedId(updated.id);
    setIsCreating(false);
    setDraftTemplate(null);
  };

  const handleDeletedProjectType = (id: string) => {
    setProjectTypes((current) => current.filter((projectType) => projectType.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setIsCreating(true);
      setDraftTemplate(emptyProjectType);
    }
  };

  const selectedProjectType = useMemo<ProjectTypePayload>(() => {
    if (isCreating) {
      return draftTemplate ?? emptyProjectType;
    }
    const projectType = projectTypes.find((item) => item.id === selectedId);
    return toPayload(projectType ?? null);
  }, [draftTemplate, isCreating, projectTypes, selectedId]);

  const showBackButton = projectTypes.length > 0;

  return (
    <div className="space-y-6">
      {viewMode === 'list' ? (
        <ProjectTypesTable
          projectTypes={projectTypes}
          selectedId={isCreating ? null : selectedId}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
          onDuplicate={handleDuplicate}
        />
      ) : (
        <div className="space-y-4">
          {showBackButton ? (
            <Button variant="ghost" className="w-fit gap-2" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4" />
              Back to project types
            </Button>
          ) : null}
          <ProjectTypeEditor
            key={selectedProjectType.id ?? (isCreating ? 'new-project-type' : 'empty-state')}
            projectType={selectedProjectType}
            isCreating={isCreating}
            onSaved={handleSaved}
            onDeleted={handleDeletedProjectType}
          />
        </div>
      )}
    </div>
  );
}

