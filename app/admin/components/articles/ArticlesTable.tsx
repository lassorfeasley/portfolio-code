'use client';

import { useMemo, useState } from 'react';
import { FilePlus2, MoreHorizontal } from 'lucide-react';
import type { ArticleRecord } from '@/types/projects';
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

type ArticlesTableProps = {
  articles: ArticleRecord[];
  selectedId: string | null;
  onSelect: (articleId: string) => void;
  onCreateNew: () => void;
  onDuplicate: (article: ArticleRecord) => void;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function ArticlesTable({
  articles,
  selectedId,
  onSelect,
  onCreateNew,
  onDuplicate,
}: ArticlesTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const searchText = search.trim().toLowerCase();
      if (searchText) {
        const haystack = `${article.name ?? ''} ${article.title ?? ''} ${article.slug ?? ''} ${article.publication ?? ''}`.toLowerCase();
        if (!haystack.includes(searchText)) return false;
      }
      if (statusFilter === 'draft' && !article.draft) return false;
      if (statusFilter === 'published' && article.draft) return false;
      if (statusFilter === 'archived' && !article.archived) return false;
      return true;
    });
  }, [articles, search, statusFilter]);

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Articles</CardTitle>
          <CardDescription>Manage articles and writing pieces.</CardDescription>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <FilePlus2 className="h-4 w-4" />
          New article
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input
            placeholder="Search by name, title, slug, or publication…"
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
                <TableHead className="w-[30%]">Title</TableHead>
                <TableHead>Publication</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No articles match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredArticles.map((article) => (
                  <TableRow
                    key={article.id}
                    onClick={() => onSelect(article.id)}
                    className={cn(
                      'cursor-pointer',
                      selectedId === article.id && 'bg-muted/60 hover:bg-muted/60'
                    )}
                  >
                    <TableCell>
                      <p className="font-medium">{article.title || article.name || '(Untitled)'}</p>
                      <p className="text-sm text-muted-foreground">{article.slug}</p>
                    </TableCell>
                    <TableCell>
                      {article.publication || '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(article.date_published)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={article.draft ? 'secondary' : 'default'}>
                          {article.draft ? 'Draft' : 'Published'}
                        </Badge>
                        {article.archived ? <Badge variant="outline">Archived</Badge> : null}
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
                          <DropdownMenuItem onClick={() => onSelect(article.id)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(article)}>
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

