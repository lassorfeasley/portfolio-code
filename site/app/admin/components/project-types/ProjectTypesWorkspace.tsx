'use client';

import { ArrowLeft } from 'lucide-react';
import type { ProjectTypePayload, ProjectTypeRecord } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { ProjectTypesTable } from './ProjectTypesTable';
import { ProjectTypeEditor } from './ProjectTypeEditor';
import { useWorkspace, useSelectedPayload } from '@/app/hooks/useWorkspace';

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
  const workspace = useWorkspace<ProjectTypeRecord, ProjectTypePayload>({
    initialItems: initialProjectTypes,
    emptyPayload: emptyProjectType,
    toPayload,
    getItemName: (projectType) => projectType.name ?? '',
    getItemSlug: (projectType) => projectType.slug ?? null,
  });

  const selectedProjectType = useSelectedPayload(
    workspace.items,
    workspace.selectedId,
    workspace.isCreating,
    workspace.draftTemplate,
    emptyProjectType,
    toPayload
  );

  const showBackButton = workspace.items.length > 0;

  return (
    <div className="space-y-6">
      {workspace.viewMode === 'list' ? (
        <ProjectTypesTable
          projectTypes={workspace.items}
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
              Back to project types
            </Button>
          ) : null}
          <ProjectTypeEditor
            key={selectedProjectType.id ?? (workspace.isCreating ? 'new-project-type' : 'empty-state')}
            projectType={selectedProjectType}
            isCreating={workspace.isCreating}
            onSaved={workspace.handleSaved}
            onDeleted={workspace.handleDeleted}
          />
        </div>
      )}
    </div>
  );
}

