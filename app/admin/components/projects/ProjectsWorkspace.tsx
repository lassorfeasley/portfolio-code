'use client';

import { ArrowLeft } from 'lucide-react';
import type { ProjectPayload, ProjectRecord, ProjectTypeRecord } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { ProjectsTable } from './ProjectsTable';
import { ProjectEditor } from './ProjectEditor';
import { useWorkspace, useSelectedPayload } from '@/app/hooks/useWorkspace';

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
  const workspace = useWorkspace<ProjectRecord, ProjectPayload>({
    initialItems: initialProjects,
    emptyPayload: emptyProject,
    toPayload,
    getItemName: (project) => project.name ?? '',
    getItemSlug: (project) => project.slug ?? null,
  });

  const selectedProject = useSelectedPayload(
    workspace.items,
    workspace.selectedId,
    workspace.isCreating,
    workspace.draftTemplate,
    emptyProject,
    toPayload
  );

  const showBackButton = workspace.items.length > 0;

  return (
    <div className="space-y-6">
      {workspace.viewMode === 'list' ? (
        <ProjectsTable
          projects={workspace.items}
          projectTypes={projectTypes}
          selectedId={workspace.isCreating ? null : workspace.selectedId}
          onSelect={workspace.handleSelect}
          onCreateNew={workspace.handleCreateNew}
          onDuplicate={workspace.handleDuplicate}
        />
      ) : (
        <div className="space-y-4">
          {showBackButton ? (
            <Button variant="ghost" className="w-fit gap-2" onClick={workspace.handleBackToList}>
              <ArrowLeft className="h-4 w-4" />
              Back to projects
            </Button>
          ) : null}
          <ProjectEditor
            key={selectedProject.id ?? (workspace.isCreating ? 'new-project' : 'empty-state')}
            project={selectedProject}
            projectTypes={projectTypes}
            isCreating={workspace.isCreating}
            onSaved={workspace.handleSaved}
            onDeleted={workspace.handleDeleted}
          />
        </div>
      )}
    </div>
  );
}


