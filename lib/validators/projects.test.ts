import { describe, expect, it } from 'vitest';
import { validateProjectPayload } from '@/lib/validators/projects';

describe('validateProjectPayload', () => {
  it('rejects invalid slug characters', () => {
    const { errors } = validateProjectPayload({
      slug: 'Invalid Slug!',
      name: 'Test',
      description: '',
      featured_image_url: '',
      images_urls: [],
      process_image_urls: [],
      process_images_label: '',
      process_and_context_html: '',
      year: '',
      linked_document_url: '',
      video_url: '',
      fallback_writing_url: '',
      project_type_id: null,
      draft: true,
      archived: false,
    });
    expect(errors).toMatchObject({ slug: expect.any(String) });
  });

  it('sanitizes empty strings to null and deduplicates urls', () => {
    const { data, errors } = validateProjectPayload({
      slug: 'valid-slug',
      name: ' ',
      description: '  ',
      featured_image_url: '',
      images_urls: ['https://example.com/a.png', 'https://example.com/a.png', ''],
      process_image_urls: [' https://example.com/b.png '],
      process_images_label: '  label ',
      process_and_context_html: '<p>Body</p>',
      year: ' 2024 ',
      linked_document_url: null,
      video_url: '',
      fallback_writing_url: 'https://example.com/text',
      project_type_id: null,
      draft: false,
      archived: false,
    });
    expect(errors).toBeNull();
    expect(data.name).toBeNull();
    expect(data.description).toBeNull();
    expect(data.images_urls).toEqual(['https://example.com/a.png']);
    expect(data.process_image_urls).toEqual(['https://example.com/b.png']);
    expect(data.process_images_label).toBe('label');
    expect(data.year).toBe('2024');
  });

  it('requires slug value', () => {
    const { errors } = validateProjectPayload({
      slug: '   ',
      name: 'Test',
      description: '',
      featured_image_url: '',
      images_urls: [],
      process_image_urls: [],
      process_images_label: '',
      process_and_context_html: '',
      year: '',
      linked_document_url: '',
      video_url: '',
      fallback_writing_url: '',
      project_type_id: null,
      draft: false,
      archived: false,
    });
    expect(errors).toMatchObject({ slug: 'Slug is required.' });
  });

  it('enforces process html length limit', () => {
    const hugeHtml = '<p>x</p>'.repeat(8000); // > 50000 chars
    const { errors } = validateProjectPayload({
      slug: 'valid-slug',
      name: 'Test',
      description: '',
      featured_image_url: '',
      images_urls: [],
      process_image_urls: [],
      process_images_label: '',
      process_and_context_html: hugeHtml,
      year: '',
      linked_document_url: '',
      video_url: '',
      fallback_writing_url: '',
      project_type_id: null,
      draft: false,
      archived: false,
    });
    expect(errors).toMatchObject({ process_and_context_html: 'Process HTML is too long.' });
  });

  it('normalizes booleans and project type ids', () => {
    const { data, errors } = validateProjectPayload({
      slug: 'valid',
      name: 'Project',
      description: '',
      featured_image_url: '',
      images_urls: [],
      process_image_urls: [],
      process_images_label: '',
      process_and_context_html: '',
      year: '',
      linked_document_url: '',
      video_url: '',
      fallback_writing_url: '',
      project_type_id: ' 123 ',
      draft: 0 as unknown as boolean,
      archived: 1 as unknown as boolean,
    });
    expect(errors).toBeNull();
    expect(data.project_type_id).toBe('123');
    expect(data.draft).toBe(false);
    expect(data.archived).toBe(true);
  });
});



