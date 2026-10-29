import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import { imageSchema } from '../image/image.field';
import { switchSchema } from '../switch/switch.field';
import { tagSelectSchema } from '../tag-select/tag-select.field';

export const SEO_TITLE_MAX_LENGTH = 60;
export const SEO_LEAD_MAX_LENGTH = 155;

export const rootMetadataPropertySchema = z.object({
  key: z.string().min(1).describe('Name of the property'),
  value: z.string().describe('Value of the property'),
  public: z.boolean().describe('Whether the website may read the property'),
});

export const rootMetadataSchema = z.object({
  title: z.string().describe('Title of the page.'),
  lead: z.string().describe('Short introduction summarising the page.'),
  imageId: imageSchema,
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .describe(
      'URL path segment of the page: lowercase words separated by dashes.'
    ),
  tags: tagSelectSchema.describe(
    'IDs of existing page tags. Keep the existing value and never invent an ID.'
  ),
  hidden: switchSchema.describe(
    'Whether the page is hidden from search engines and listings.'
  ),
  showNavigation: switchSchema.describe(
    'Whether the website navigation bar is shown above the page content.'
  ),
  showFooter: switchSchema.describe(
    'Whether the website footer is shown below the page content.'
  ),
  seoTitle: z
    .string()
    .describe(
      `Title shown to search engines, at most about ${SEO_TITLE_MAX_LENGTH} characters. Falls back to the title.`
    ),
  seoDescription: z
    .string()
    .describe(
      `Description shown to search engines, at most about ${SEO_LEAD_MAX_LENGTH} characters. Falls back to the lead.`
    ),
  socialMediaTitle: z
    .string()
    .describe(
      'Title shown when the page is shared on social media. Falls back to the SEO title.'
    ),
  socialMediaDescription: z
    .string()
    .describe(
      'Description shown when the page is shared on social media. Falls back to the SEO description.'
    ),
  socialMediaImageId: imageSchema,
  properties: z
    .array(rootMetadataPropertySchema)
    .describe(
      'Key value pairs for integrations. Only public properties are exposed to the website. Keep the existing entries.'
    ),
});

export type RootMetadataProperty = z.infer<typeof rootMetadataPropertySchema>;
export type RootMetadata = Partial<z.infer<typeof rootMetadataSchema>>;

export const rootMetadataFieldAi = (
  key: keyof typeof rootMetadataSchema.shape
): FieldAiParams => ({
  instructions: rootMetadataSchema.shape[key].description,
  schema: toAiSchema(rootMetadataSchema.shape[key]),
});
