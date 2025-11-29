'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ProjectPayload, ProjectRecord, ProjectTypeRecord } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { ProjectsTable } from './ProjectsTable';
import { ProjectEditor } from './ProjectEditor';

type ProjectsWorkspaceProps = {
  initialProjects: ProjectRecord[];
  projectTypes: ProjectTypeRecord[];
};

const emptyProject: ProjectPayload = {
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

function toPayload(project: ProjectRecord | null): ProjectPayload {
  if (!project) return emptyProject;
  return {
    ...project,
    images_urls: project.images_urls ?? [],
    process_image_urls: project.process_image_urls ?? [],
    process_images_label: project.process_images_label ?? '',
    process_and_context_html: project.process_and_context_html ?? '',
    description: project.description ?? '',
    featured_image_url: project.featured_image_url ?? '',
    linked_document_url: project.linked_document_url ?? '',
    video_url: project.video_url ?? '',
    fallback_writing_url: project.fallback_writing_url ?? '',
    year: project.year ?? '',
  };
}

export function ProjectsWorkspace({ initialProjects, projectTypes }: ProjectsWorkspaceProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>(initialProjects);
  const [selectedId, setSelectedId] = useState<string | null>(initialProjects[0]?.id ?? null);
  const [isCreating, setIsCreating] = useState(initialProjects.length === 0);
  const [draftTemplate, setDraftTemplate] = useState<ProjectPayload | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>(initialProjects.length === 0 ? 'editor' : 'list');

  const handleSelect = (projectId: string) => {
    setSelectedId(projectId);
    setIsCreating(false);
    setDraftTemplate(null);
    setViewMode('editor');
  };

  const handleCreateNew = () => {
    setSelectedId(null);
    setIsCreating(true);
    setDraftTemplate(emptyProject);
    setViewMode('editor');
  };

  const handleDuplicate = (project: ProjectRecord) => {
    const duplicated = toPayload(project);
    duplicated.id = undefined;
    duplicated.slug = `${duplicated.slug ?? project.id}-copy`;
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

  const handleSaved = (updated: ProjectRecord) => {
    setProjects((current) => {
      const exists = current.some((project) => project.id === updated.id);
      if (exists) {
        return current.map((project) => (project.id === updated.id ? updated : project));
      }
      return [updated, ...current];
    });
    setSelectedId(updated.id);
    setIsCreating(false);
    setDraftTemplate(null);
  };

  const handleDeletedProject = (id: string) => {
    setProjects((current) => current.filter((project) => project.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setIsCreating(true);
      setDraftTemplate(emptyProject);
    }
  };

  const selectedProject = useMemo<ProjectPayload>(() => {
    if (isCreating) {
      return draftTemplate ?? emptyProject;
    }
    const project = projects.find((item) => item.id === selectedId);
    return toPayload(project ?? null);
  }, [draftTemplate, isCreating, projects, selectedId]);

  const showBackButton = projects.length > 0;

  return (
    <div className="space-y-6">
      {viewMode === 'list' ? (
        <ProjectsTable
          projects={projects}
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
              Back to projects
            </Button>
          ) : null}
          <ProjectEditor
            key={selectedProject.id ?? (isCreating ? 'new-project' : 'empty-state')}
            project={selectedProject}
            projectTypes={projectTypes}
            isCreating={isCreating}
            onSaved={handleSaved}
            onDeleted={handleDeletedProject}
          />
        </div>
      )}
    </div>
  );
}


