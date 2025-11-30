'use client';

import { useMemo, useState } from 'react';
import { FilePlus2, MoreHorizontal } from 'lucide-react';
import type { ProjectTypeRecord } from '@/types/projects';
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

type ProjectTypesTableProps = {
  projectTypes: ProjectTypeRecord[];
  selectedId: string | null;
  onSelect: (projectTypeId: string) => void;
  onCreateNew: () => void;
  onDuplicate: (projectType: ProjectTypeRecord) => void;
};

export function ProjectTypesTable({
  projectTypes,
  selectedId,
  onSelect,
  onCreateNew,
  onDuplicate,
}: ProjectTypesTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredProjectTypes = useMemo(() => {
    return projectTypes.filter((projectType) => {
      const searchText = search.trim().toLowerCase();
      if (searchText) {
        const haystack = `${projectType.name ?? ''} ${projectType.slug ?? ''} ${projectType.category ?? ''}`.toLowerCase();
        if (!haystack.includes(searchText)) return false;
      }
      if (statusFilter === 'draft' && !projectType.draft) return false;
      if (statusFilter === 'published' && projectType.draft) return false;
      if (statusFilter === 'archived' && !projectType.archived) return false;
      return true;
    });
  }, [projectTypes, search, statusFilter]);

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Project Types</CardTitle>
          <CardDescription>Manage project type sections for organizing your portfolio.</CardDescription>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <FilePlus2 className="h-4 w-4" />
          New project type
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input
            placeholder="Search by name, slug, or category…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="lg:max-w-sm"
          />
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
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjectTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No project types match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjectTypes.map((projectType) => (
                  <TableRow
                    key={projectType.id}
                    onClick={() => onSelect(projectType.id)}
                    className={cn(
                      'cursor-pointer',
                      selectedId === projectType.id && 'bg-muted/60 hover:bg-muted/60'
                    )}
                  >
                    <TableCell>
                      <p className="font-medium">{projectType.name || '(Untitled)'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">{projectType.slug}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {projectType.category || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={projectType.draft ? 'secondary' : 'default'}>
                          {projectType.draft ? 'Draft' : 'Published'}
                        </Badge>
                        {projectType.archived ? <Badge variant="outline">Archived</Badge> : null}
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
                          <DropdownMenuItem onClick={() => onSelect(projectType.id)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(projectType)}>
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

