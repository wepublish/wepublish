import { BaseField, Fields } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import {
  DocumentRootProps,
  RootProperty,
  UserFields,
} from '@wepublish/puck-content/editor';

export type RootFieldAi = (key: keyof DocumentRootProps) => FieldAiParams;

type DocumentRootFields = Partial<
  Fields<DocumentRootProps, UserFields[keyof UserFields] & BaseField>
>;

export const rootGeneralFields = (ai: RootFieldAi) =>
  ({
    title: { type: 'text', label: 'Title', ai: ai('title') },
    lead: { type: 'textarea', label: 'Lead', ai: ai('lead') },
    imageId: { type: 'image', label: 'Image', ai: ai('imageId') },
    slug: { type: 'text', label: 'Slug', ai: ai('slug') },
  }) satisfies DocumentRootFields;

export const rootSeoFields = (ai: RootFieldAi) =>
  ({
    seoTitle: { type: 'text', label: 'SEO title', ai: ai('seoTitle') },
    seoDescription: {
      type: 'textarea',
      label: 'SEO description',
      ai: ai('seoDescription'),
    },
  }) satisfies DocumentRootFields;

export const rootSocialMediaFields = (ai: RootFieldAi) =>
  ({
    socialMediaTitle: {
      type: 'text',
      label: 'Social media title',
      ai: ai('socialMediaTitle'),
    },
    socialMediaDescription: {
      type: 'textarea',
      label: 'Social media description',
      ai: ai('socialMediaDescription'),
    },
    socialMediaImageId: {
      type: 'image',
      label: 'Social media image',
      ai: ai('socialMediaImageId'),
    },
  }) satisfies DocumentRootFields;

export const rootPropertiesFields = (ai: RootFieldAi) =>
  ({
    properties: {
      type: 'array',
      label: 'Properties',
      arrayFields: {
        key: { type: 'text', label: 'Key' },
        value: { type: 'text', label: 'Value' },
        public: { type: 'switch', label: 'Public' },
      },
      defaultItemProps: { key: '', value: '', public: true },
      getItemSummary: (item: RootProperty) => item.key || 'Property',
      ai: ai('properties'),
    },
  }) satisfies DocumentRootFields;
