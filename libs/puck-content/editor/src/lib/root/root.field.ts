import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import { PuckEditorDocumentKind } from '../document-kind/document-kind';
import { imageSchema } from '../image/image.field';
import { switchSchema } from '../switch/switch.field';
import { tagSelectSchema } from '../tag-select/tag-select.field';

export const SEO_TITLE_MAX_LENGTH = 60;
export const SEO_LEAD_MAX_LENGTH = 155;

export const rootPropertySchema = z.object({
  key: z.string().min(1).describe('Name of the property'),
  value: z.string().describe('Value of the property'),
  public: z.boolean().describe('Whether the website may read the property'),
});

const existingIds = (records: string) =>
  `IDs of existing ${records}. Keep the existing value and never invent an ID.`;

const documentRootShape = (document: string) => ({
  title: z.string().describe(`Title of the ${document}.`),
  lead: z.string().describe(`Short introduction summarising the ${document}.`),
  imageId: imageSchema,
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .describe(
      `URL path segment of the ${document}: lowercase words separated by dashes.`
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
      `Title shown when the ${document} is shared on social media. Falls back to the SEO title.`
    ),
  socialMediaDescription: z
    .string()
    .describe(
      `Description shown when the ${document} is shared on social media. Falls back to the SEO description.`
    ),
  socialMediaImageId: imageSchema,
  properties: z
    .array(rootPropertySchema)
    .describe(
      'Key value pairs for integrations. Only public properties are exposed to the website. Keep the existing entries.'
    ),
});

export const pageRootSchema = z.object({
  ...documentRootShape('page'),
  tags: tagSelectSchema.describe(existingIds('page tags')),
  hidden: switchSchema.describe(
    'Whether the page is hidden from search engines and listings.'
  ),
  showNavigation: switchSchema.describe(
    'Whether the website navigation bar is shown above the page content.'
  ),
  showFooter: switchSchema.describe(
    'Whether the website footer is shown below the page content.'
  ),
});

export const articleRootSchema = z.object({
  preTitle: z
    .string()
    .describe('Short kicker shown above the title of the article.'),
  ...documentRootShape('article'),
  canonicalUrl: z
    .string()
    .describe(
      'Absolute URL of the original publication when the article first appeared elsewhere. Leave empty otherwise.'
    ),
  authorIds: z
    .array(z.string())
    .describe(existingIds('authors who wrote the article, in byline order')),
  hideAuthor: switchSchema.describe(
    'Whether the byline with the authors is hidden on the website.'
  ),
  tags: tagSelectSchema.describe(existingIds('article tags')),
  paywallId: z
    .string()
    .describe(
      'ID of an existing paywall that protects the article. Keep the existing value and never invent an ID.'
    ),
  breaking: switchSchema.describe('Whether the article is breaking news.'),
  hidden: switchSchema.describe(
    'Whether the article is hidden from search engines and listings.'
  ),
  disableComments: switchSchema.describe(
    'Whether readers are prevented from commenting on the article.'
  ),
  shared: switchSchema.describe(
    'Whether the article is shared with peered media outlets.'
  ),
  socialMediaAuthorIds: z
    .array(z.string())
    .describe(
      existingIds('authors shown when the article is shared on social media')
    ),
});

export const rootSchemas = {
  page: pageRootSchema,
  article: articleRootSchema,
} satisfies Record<PuckEditorDocumentKind, z.ZodObject>;

export type RootProperty = z.infer<typeof rootPropertySchema>;
export type PageRootProps = Partial<z.infer<typeof pageRootSchema>>;
export type ArticleRootProps = Partial<z.infer<typeof articleRootSchema>>;
export type DocumentRootProps = Pick<
  PageRootProps,
  keyof PageRootProps & keyof ArticleRootProps
>;

export const rootFieldAi = <Shape extends Record<string, z.ZodType>>(
  schema: z.ZodObject<Shape>,
  key: keyof Shape & string
): FieldAiParams => ({
  instructions: schema.shape[key].description,
  schema: toAiSchema(schema.shape[key]),
});
