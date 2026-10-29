import { rootMetadataFieldAi, rootMetadataSchema } from './seo.field';

describe('rootMetadataFieldAi', () => {
  it('derives the AI params of a root field from the metadata schema', () => {
    const ai = rootMetadataFieldAi('properties');

    expect(ai.instructions).toBe(
      rootMetadataSchema.shape.properties.description
    );
    expect(ai.schema).toMatchObject({ type: 'array' });
  });

  it('only allows lowercase dashed slugs', () => {
    expect(rootMetadataSchema.shape.slug.safeParse('about-us').success).toBe(
      true
    );
    expect(rootMetadataSchema.shape.slug.safeParse('About Us').success).toBe(
      false
    );
  });
});
