import { describe, expect, it } from 'vitest';
import { validateProjectTypePayload } from '@/lib/validators/project-types';

describe('validateProjectTypePayload', () => {
  it('validates slug format and presence', () => {
    const { errors } = validateProjectTypePayload({
      id: 'type-1',
      name: 'Interaction',
      slug: 'Invalid Slug!',
      category: '',
      draft: false,
      archived: false,
    });
    expect(errors).toMatchObject({
      slug: 'Slug can only include lowercase letters, numbers, and hyphens.',
    });
  });

  it('trims strings and coerces booleans', () => {
    const { data, errors } = validateProjectTypePayload({
      id: 'type-1',
      name: '  Interaction Design ',
      slug: 'interaction-design',
      category: '  Design  ',
      draft: 0 as unknown as boolean,
      archived: 1 as unknown as boolean,
    });
    expect(errors).toBeNull();
    expect(data).toEqual({
      name: 'Interaction Design',
      slug: 'interaction-design',
      category: 'Design',
      draft: false,
      archived: true,
    });
  });
});
