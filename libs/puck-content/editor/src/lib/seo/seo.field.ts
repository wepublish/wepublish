import { ObjectField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import { UserFields } from '../fields';
import { imageFieldAi, imageSchema } from '../image/image.field';

export type SEOValue = {
  title?: string;
  lead?: string;
  imageId?: string;
};

export const SEO_TITLE_MAX_LENGTH = 60;
export const SEO_LEAD_MAX_LENGTH = 155;

const titleInstructions = `Page title, at most about ${SEO_TITLE_MAX_LENGTH} characters`;
const leadInstructions = `Page description, at most about ${SEO_LEAD_MAX_LENGTH} characters`;

export const seoSchema = z
  .object({
    title: z.string().describe(titleInstructions),
    lead: z.string().describe(leadInstructions),
    imageId: imageSchema,
  })
  .partial();

export const seoFieldAi: FieldAiParams = {
  instructions: `Metadata shown to search engines and social media shares: title (max ~${SEO_TITLE_MAX_LENGTH} characters) and lead (description, max ~${SEO_LEAD_MAX_LENGTH} characters) summarising the page content. imageId references an already uploaded image — keep the existing value and never invent one.`,
  schema: toAiSchema(seoSchema),
};

export type SEOField = ObjectField<SEOValue, UserFields[keyof UserFields]>;

type SEOFieldOptions = {
  label?: string;
  /** Prepended to the generic SEO instructions, e.g. where the metadata shows up */
  instructions?: string;
};

/**
 * Object field for SEO metadata with a title, lead and image.
 */
export const seoField = ({
  label,
  instructions,
}: SEOFieldOptions = {}): SEOField => ({
  type: 'object',
  label,
  objectFields: {
    title: {
      type: 'text',
      label: 'Title',
      ai: { instructions: titleInstructions },
    },
    lead: {
      type: 'textarea',
      label: 'Lead',
      ai: { instructions: leadInstructions },
    },
    imageId: {
      type: 'image',
      label: 'Image',
      ai: imageFieldAi,
    },
  },
  ai: {
    ...seoFieldAi,
    instructions: [instructions, seoFieldAi.instructions]
      .filter(Boolean)
      .join(' '),
  },
});
