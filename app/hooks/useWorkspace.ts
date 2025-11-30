import { useMemo, useState } from 'react';

type WorkspaceItem = {
  id: string;
  [key: string]: unknown;
};

type WorkspaceConfig<TItem extends WorkspaceItem, TPayload> = {
  initialItems: TItem[];
  emptyPayload: TPayload;
  toPayload: (item: TItem | null) => TPayload;
  getItemName: (item: TItem) => string;
  getItemSlug: (item: TItem) => string | null;
};

type WorkspaceState<TItem extends WorkspaceItem, TPayload> = {
  items: TItem[];
  selectedId: string | null;
  isCreating: boolean;
  draftTemplate: TPayload | null;
  viewMode: 'list' | 'editor';
};

type WorkspaceActions<TItem extends WorkspaceItem> = {
  handleSelect: (id: string) => void;
  handleCreateNew: () => void;
  handleDuplicate: (item: TItem) => void;
  handleBackToList: () => void;
  handleSaved: (updated: TItem) => void;
  handleDeleted: (id: string) => void;
  setItems: (items: TItem[]) => void;
};

/**
 * Generic workspace hook for managing list/editor views with create/edit/delete operations.
 * Eliminates code duplication between ProjectsWorkspace and ProjectTypesWorkspace.
 */
export function useWorkspace<TItem extends WorkspaceItem, TPayload extends object>(
  config: WorkspaceConfig<TItem, TPayload>
): WorkspaceState<TItem, TPayload> & WorkspaceActions<TItem> {
  const { initialItems, emptyPayload, toPayload, getItemName, getItemSlug } = config;

  const [items, setItems] = useState<TItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialItems[0]?.id ?? null
  );
  const [isCreating, setIsCreating] = useState(initialItems.length === 0);
  const [draftTemplate, setDraftTemplate] = useState<TPayload | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>(
    initialItems.length === 0 ? 'editor' : 'list'
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setIsCreating(false);
    setDraftTemplate(null);
    setViewMode('editor');
  };

  const handleCreateNew = () => {
    setSelectedId(null);
    setIsCreating(true);
    setDraftTemplate(emptyPayload);
    setViewMode('editor');
  };

  const handleDuplicate = (item: TItem) => {
    const duplicated = toPayload(item);
    // Remove id to create new item
    if ('id' in duplicated && typeof duplicated.id === 'string') {
      (duplicated as { id?: string }).id = undefined;
    }
    const slug = getItemSlug(item);
    const name = getItemName(item);
    if ('slug' in duplicated && typeof duplicated.slug === 'string') {
      (duplicated as { slug: string }).slug = `${slug ?? item.id}-copy`;
    }
    if ('name' in duplicated && typeof duplicated.name === 'string') {
      (duplicated as { name: string }).name = name ? `${name} (copy)` : 'Untitled copy';
    }
    if ('draft' in duplicated && typeof duplicated.draft === 'boolean') {
      (duplicated as { draft: boolean }).draft = true;
    }
    setDraftTemplate(duplicated);
    setSelectedId(null);
    setIsCreating(true);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setIsCreating(false);
    setDraftTemplate(null);
  };

  const handleSaved = (updated: TItem) => {
    setItems((current) => {
      const exists = current.some((item) => item.id === updated.id);
      if (exists) {
        return current.map((item) => (item.id === updated.id ? updated : item));
      }
      return [updated, ...current];
    });
    setSelectedId(updated.id);
    setIsCreating(false);
    setDraftTemplate(null);
  };

  const handleDeleted = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setIsCreating(true);
      setDraftTemplate(emptyPayload);
    }
  };

  return {
    items,
    selectedId,
    isCreating,
    draftTemplate,
    viewMode,
    handleSelect,
    handleCreateNew,
    handleDuplicate,
    handleBackToList,
    handleSaved,
    handleDeleted,
    setItems,
  };
}

/**
 * Get the selected item payload, using draft template if creating or finding from items.
 */
export function useSelectedPayload<TItem extends WorkspaceItem, TPayload extends object>(
  items: TItem[],
  selectedId: string | null,
  isCreating: boolean,
  draftTemplate: TPayload | null,
  emptyPayload: TPayload,
  toPayload: (item: TItem | null) => TPayload
): TPayload {
  return useMemo<TPayload>(() => {
    if (isCreating) {
      return draftTemplate ?? emptyPayload;
    }
    const item = items.find((item) => item.id === selectedId);
    return toPayload(item ?? null);
  }, [draftTemplate, isCreating, items, selectedId, emptyPayload, toPayload]);
}
