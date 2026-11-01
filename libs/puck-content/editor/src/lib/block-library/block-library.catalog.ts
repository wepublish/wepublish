import type { Components } from '../config.types';

export type BlockName = Extract<keyof Components, string>;

export const blockCategoryIds = [
  'text',
  'media',
  'layout',
  'teaser',
  'engagement',
  'form',
  'embed',
] as const;

export type BlockCategoryId = (typeof blockCategoryIds)[number];

export type BlockGroup<Name extends string = string> = {
  id: string;
  blocks: Name[];
};

export type BlockCategory<
  Id extends string = string,
  Name extends string = string,
> = {
  id: Id;
  blocks: Name[];
  group?: BlockGroup<Name>;
};

export const blockCatalog: BlockCategory<BlockCategoryId, BlockName>[] = [
  {
    id: 'text',
    blocks: ['Title', 'RichText', 'Quote', 'Listicle', 'Button', 'Break'],
  },
  {
    id: 'media',
    blocks: [
      'Image',
      'Lightbox',
      'YouTube',
      'Vimeo',
      'FacebookVideo',
      'TikTok',
      'Streamable',
      'SoundCloud',
    ],
  },
  {
    id: 'layout',
    blocks: [
      'Container',
      'Grid',
      'DynamicGrid',
      'Row',
      'Slider',
      'Collapsible',
      'Space',
    ],
  },
  {
    id: 'teaser',
    blocks: ['Teaser'],
    group: {
      id: 'teaserParts',
      blocks: [
        'TeaserImage',
        'TeaserPreTitle',
        'TeaserTitle',
        'TeaserLead',
        'TeaserAuthors',
        'TeaserDate',
        'TeaserTags',
      ],
    },
  },
  {
    id: 'engagement',
    blocks: [
      'Subscribe',
      'MailchimpForm',
      'Poll',
      'Comment',
      'Event',
      'Crowdfunding',
    ],
  },
  {
    id: 'form',
    blocks: ['Form'],
    group: {
      id: 'formFields',
      blocks: [
        'FormInput',
        'FormTextarea',
        'FormCheckbox',
        'FormSelect',
        'FormRadioGroup',
        'FormHidden',
        'FormSubmit',
      ],
    },
  },
  {
    id: 'embed',
    blocks: [
      'Facebook',
      'Instagram',
      'Twitter',
      'Polis',
      'IFrame',
      'Html',
      'BildwurfAd',
    ],
  },
];

export const catalogBlockNames = <Name extends string>(
  catalog: BlockCategory<string, Name>[]
): Name[] =>
  catalog.flatMap(({ blocks, group }) => [...blocks, ...(group?.blocks ?? [])]);
