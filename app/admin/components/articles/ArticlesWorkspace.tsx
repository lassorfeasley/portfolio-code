'use client';

import { ArrowLeft } from 'lucide-react';
import type { ArticlePayload, ArticleRecord } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { ArticlesTable } from './ArticlesTable';
import { ArticleEditor } from './ArticleEditor';
import { useWorkspace, useSelectedPayload } from '@/app/hooks/useWorkspace';

type ArticlesWorkspaceProps = {
  initialArticles: ArticleRecord[];
};

const emptyArticle: ArticlePayload = {
  name: '',
  slug: '',
  title: '',
  publication: '',
  date_published: null,
  featured_image_url: null,
  url: '',
  draft: true,
  archived: false,
};

function toPayload(article: ArticleRecord | null): ArticlePayload {
  if (!article) return emptyArticle;
  return {
    ...article,
    name: article.name ?? '',
    slug: article.slug ?? '',
    title: article.title ?? '',
    publication: article.publication ?? '',
    url: article.url ?? '',
  };
}

export function ArticlesWorkspace({ initialArticles }: ArticlesWorkspaceProps) {
  const workspace = useWorkspace<ArticleRecord, ArticlePayload>({
    initialItems: initialArticles,
    emptyPayload: emptyArticle,
    toPayload,
    getItemName: (article) => article.name ?? article.title ?? '',
    getItemSlug: (article) => article.slug ?? null,
  });

  const selectedArticle = useSelectedPayload(
    workspace.items,
    workspace.selectedId,
    workspace.isCreating,
    workspace.draftTemplate,
    emptyArticle,
    toPayload
  );

  const showBackButton = workspace.items.length > 0;

  return (
    <div className="space-y-6">
      {workspace.viewMode === 'list' ? (
        <ArticlesTable
          articles={workspace.items}
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
              Back to articles
            </Button>
          ) : null}
          <ArticleEditor
            key={selectedArticle.id ?? (workspace.isCreating ? 'new-article' : 'empty-state')}
            article={selectedArticle}
            isCreating={workspace.isCreating}
            onSaved={workspace.handleSaved}
            onDeleted={workspace.handleDeleted}
          />
        </div>
      )}
    </div>
  );
}

