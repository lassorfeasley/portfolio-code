import type {
  ProjectTypeDetail,
  ProjectTypeRow,
  ProjectTypeSummary,
} from '@/lib/domain/project-types/types';

export function toProjectTypeSummary(row: ProjectTypeRow): ProjectTypeSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
  };
}

export function toProjectTypeDetail(row: ProjectTypeRow): ProjectTypeDetail {
  return {
    ...toProjectTypeSummary(row),
    landing_page_credentials: row.landing_page_credentials,
    font_awesome_icon: row.font_awesome_icon,
    draft: row.draft,
    archived: row.archived,
  };
}
