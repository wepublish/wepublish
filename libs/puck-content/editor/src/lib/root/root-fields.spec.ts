import { FieldAiParams } from '@puckeditor/plugin-ai';

import {
  rootGeneralFields,
  rootPropertiesFields,
  rootSeoFields,
  rootSocialMediaFields,
} from './root-fields';

const ai = (key: string): FieldAiParams => ({ instructions: `ai of ${key}` });

describe('root fields', () => {
  it('builds the general fields every document has', () => {
    expect(rootGeneralFields(ai)).toEqual({
      title: { type: 'text', label: 'Title', ai: ai('title') },
      lead: { type: 'textarea', label: 'Lead', ai: ai('lead') },
      imageId: { type: 'image', label: 'Image', ai: ai('imageId') },
      slug: { type: 'text', label: 'Slug', ai: ai('slug') },
    });
  });

  it('builds the SEO fields', () => {
    expect(rootSeoFields(ai)).toEqual({
      seoTitle: { type: 'text', label: 'SEO title', ai: ai('seoTitle') },
      seoDescription: {
        type: 'textarea',
        label: 'SEO description',
        ai: ai('seoDescription'),
      },
    });
  });

  it('builds the social media fields', () => {
    expect(Object.keys(rootSocialMediaFields(ai))).toEqual([
      'socialMediaTitle',
      'socialMediaDescription',
      'socialMediaImageId',
    ]);
    expect(rootSocialMediaFields(ai).socialMediaImageId).toEqual({
      type: 'image',
      label: 'Social media image',
      ai: ai('socialMediaImageId'),
    });
  });

  it('summarises a property by its key', () => {
    const { properties } = rootPropertiesFields(ai);

    expect(properties.ai).toEqual(ai('properties'));
    expect(
      properties.getItemSummary({ key: 'theme', value: 'dark', public: true })
    ).toBe('theme');
    expect(
      properties.getItemSummary({ key: '', value: 'dark', public: true })
    ).toBe('Property');
  });
});
