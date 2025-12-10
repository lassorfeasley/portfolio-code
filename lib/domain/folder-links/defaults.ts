import type { FolderLink } from './types';

export const defaultFolderLinks: FolderLink[] = [
  { id: '1', label: 'UI design', icon: '\uf245', href: '/project-types/interaction-design', external: false, displayOrder: 1 },
  { id: '2', label: 'Writing', icon: '\uf5ad', href: '/project-types/writing', external: false, displayOrder: 2 },
  { id: '3', label: 'Resume', icon: '\uf15b', href: 'https://docs.google.com/document/d/1qz8Qwrk6aoD1n1vEe5Zd7OhaEhun8UOuY0xcW2SnRmg/edit?tab=t.0', external: true, displayOrder: 3 },
  { id: '4', label: 'UX design', icon: '\uf06e', href: '/project-types/innovation', external: false, displayOrder: 4 },
  { id: '5', label: 'Walking forward', icon: '\uf54b', href: 'https://walking.lassor.com', external: true, displayOrder: 5 },
  { id: '6', label: 'LinkedIn', icon: '\uf0c1', href: 'https://www.linkedin.com/in/lassor/', external: true, displayOrder: 6 },
  { id: '7', label: 'Industrial design', icon: '\uf546', href: '/project-types/industrial-design', external: false, displayOrder: 7 },
  { id: '8', label: 'Seatback Safety', icon: '\uf072', href: 'https://www.lassor.com/projects/seatback-safety', external: true, displayOrder: 8 },
];

export function mergeLinksWithDefaults(dbLinks: FolderLink[] | null | undefined): FolderLink[] {
  if (!dbLinks || dbLinks.length === 0) {
    return defaultFolderLinks;
  }

  const defaultIconMap = new Map(defaultFolderLinks.map(link => [link.label, link.icon]));
  const defaultIconMapByHref = new Map(defaultFolderLinks.map(link => [link.href, link.icon]));
  
  return dbLinks.map(link => {
    // If icon is empty or whitespace, try to get from defaults
    if (!link.icon || link.icon.trim().length === 0) {
      const defaultIcon = defaultIconMap.get(link.label) || defaultIconMapByHref.get(link.href);
      if (defaultIcon) {
        return { ...link, icon: defaultIcon };
      }
    }
    return link;
  });
}
