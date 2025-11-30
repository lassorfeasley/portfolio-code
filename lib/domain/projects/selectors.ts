import type {
  ProjectDetail,
  ProjectSummary,
  ProjectTypeRow,
  ProjectTypeSummary,
  ProjectWithTypeRelation,
} from '@/lib/domain/projects/types';

function extractProjectType(rel: ProjectWithTypeRelation['project_types']): ProjectTypeRow | null {
  if (!rel) return null;
  if (Array.isArray(rel)) {
    return rel[0] ?? null;
  }
  return rel;
}

function toProjectTypeSummary(type: ProjectTypeRow | null): ProjectTypeSummary | null {
  if (!type) return null;
  return {
    id: type.id,
    name: type.name,
    slug: type.slug,
    category: type.category,
    landing_page_credentials: type.landing_page_credentials,
    font_awesome_icon: type.font_awesome_icon,
  };
}

export function toProjectSummary(row: ProjectWithTypeRelation): ProjectSummary {
  const projectType = toProjectTypeSummary(extractProjectType(row.project_types));
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    featured_image_url: row.featured_image_url,
    year: row.year,
    projectType,
  };
}

export function toProjectDetail(row: ProjectWithTypeRelation): ProjectDetail {
  return {
    ...row,
    projectType: toProjectTypeSummary(extractProjectType(row.project_types)),
  };
}
