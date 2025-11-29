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
});



