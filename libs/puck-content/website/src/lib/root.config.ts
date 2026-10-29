import {
  pageTagSelectField,
  rootMetadataFieldAi,
} from '@wepublish/puck-content/editor';

import { rootFieldTabs, withFieldTabs } from './field-tabs/field-tabs';
import { Root } from './root.component';
import { UserConfig } from './types';

type RootComponentConfig = NonNullable<UserConfig['root']>;

export const RootConfig: RootComponentConfig =
  withFieldTabs<RootComponentConfig>(
    {
      fields: {
        title: {
          type: 'text',
          label: 'Title',
          ai: rootMetadataFieldAi('title'),
        },
        lead: {
          type: 'textarea',
          label: 'Lead',
          ai: rootMetadataFieldAi('lead'),
        },
        imageId: {
          type: 'image',
          label: 'Image',
          ai: rootMetadataFieldAi('imageId'),
        },
        slug: {
          type: 'text',
          label: 'Slug',
          ai: rootMetadataFieldAi('slug'),
        },
        tags: {
          ...pageTagSelectField('Tags'),
          ai: rootMetadataFieldAi('tags'),
        },
        hidden: {
          type: 'switch',
          label: 'Hidden',
          ai: rootMetadataFieldAi('hidden'),
        },
        showNavigation: {
          type: 'switch',
          label: 'Show Navbar',
          ai: rootMetadataFieldAi('showNavigation'),
        },
        showFooter: {
          type: 'switch',
          label: 'Show Footer',
          ai: rootMetadataFieldAi('showFooter'),
        },
        seoTitle: {
          type: 'text',
          label: 'SEO title',
          ai: rootMetadataFieldAi('seoTitle'),
        },
        seoDescription: {
          type: 'textarea',
          label: 'SEO description',
          ai: rootMetadataFieldAi('seoDescription'),
        },
        socialMediaTitle: {
          type: 'text',
          label: 'Social media title',
          ai: rootMetadataFieldAi('socialMediaTitle'),
        },
        socialMediaDescription: {
          type: 'textarea',
          label: 'Social media description',
          ai: rootMetadataFieldAi('socialMediaDescription'),
        },
        socialMediaImageId: {
          type: 'image',
          label: 'Social media image',
          ai: rootMetadataFieldAi('socialMediaImageId'),
        },
        properties: {
          type: 'array',
          label: 'Properties',
          arrayFields: {
            key: { type: 'text', label: 'Key' },
            value: { type: 'text', label: 'Value' },
            public: { type: 'switch', label: 'Public' },
          },
          defaultItemProps: { key: '', value: '', public: true },
          getItemSummary: item => item.key || 'Property',
          ai: rootMetadataFieldAi('properties'),
        },
      },
      defaultProps: {
        showFooter: true,
        showNavigation: true,
      },
      render: Root,
    },
    rootFieldTabs
  );
