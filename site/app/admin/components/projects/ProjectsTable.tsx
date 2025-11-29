'use client';

import { useMemo, useState } from 'react';
import { FilePlus2, MoreHorizontal } from 'lucide-react';
import type { ProjectRecord, ProjectTypeRecord } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'draft' | 'published' | 'archived';

type ProjectsTableProps = {
  projects: ProjectRecord[];
  projectTypes: ProjectTypeRecord[];
  selectedId: string | null;
  onSelect: (projectId: string) => void;
  onCreateNew: () => void;
  onDuplicate: (project: ProjectRecord) => void;
};

export function ProjectsTable({
  projects,
  projectTypes,
  selectedId,
  onSelect,
  onCreateNew,
  onDuplicate,
}: ProjectsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const typeMap = useMemo(() => {
    return projectTypes.reduce<Record<string, string>>((acc, type) => {
      acc[type.id] = type.name;
      return acc;
    }, {});
  }, [projectTypes]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchText = search.trim().toLowerCase();
      if (searchText) {
        const haystack = `${project.name ?? ''} ${project.slug ?? ''}`.toLowerCase();
        if (!haystack.includes(searchText)) return false;
      }
      if (statusFilter === 'draft' && !project.draft) return false;
      if (statusFilter === 'published' && project.draft) return false;
      if (statusFilter === 'archived' && !project.archived) return false;
      if (typeFilter !== 'all' && project.project_type_id !== typeFilter) return false;
      return true;
    });
  }, [projects, search, statusFilter, typeFilter]);

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Browse and filter the live portfolio content.</CardDescription>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <FilePlus2 className="h-4 w-4" />
          New project
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input
            placeholder="Search by name or slug…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="lg:max-w-sm"
          />
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {projectTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No projects match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    onClick={() => onSelect(project.id)}
                    className={cn(
                      'cursor-pointer',
                      selectedId === project.id && 'bg-muted/60 hover:bg-muted/60'
                    )}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name || '(Untitled project)'}</p>
                        <p className="text-xs text-muted-foreground">{project.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{typeMap[project.project_type_id ?? ''] ?? '—'}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{project.year || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={project.draft ? 'secondary' : 'default'}>
                          {project.draft ? 'Draft' : 'Published'}
                        </Badge>
                        {project.archived ? <Badge variant="outline">Archived</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelect(project.id)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(project)}>
                            Duplicate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


