import { faker } from '@faker-js/faker';
import { Meta } from '@storybook/react';
import {
  mockArticleTeaser,
  mockCustomTeaser,
  mockEventTeaser,
  mockFlexAlignment,
  mockMailchimCampaign,
  mockTabbedContentTeaserSlots,
  mockTeaserListBlock,
  mockTeaserSlotsBlock,
} from '@wepublish/storybook/mocks';
import {
  BlockContent,
  CustomTeaser,
  FlexAlignmentBlocks,
  Maybe,
} from '@wepublish/website/api';
import nanoid from 'nanoid';

import { WithMailchimpCampaignsDecorator } from '../../testing/mailchimp-campaigns.decorator';
import { WithWebsiteProviderDecorator } from '../../testing/with-website-builder-provider';
import { TsriLayoutType } from '../teaser-layouts/tsri-layout';
import {
  TsriTabbedContent,
  TsriTabbedContentType,
} from './tsri-base-tabbed-content';

export default {
  component: TsriTabbedContent,
  title: 'Tsri/Container/Tabbed Content',
  decorators: [
    WithWebsiteProviderDecorator,
    WithMailchimpCampaignsDecorator({
      campaigns: [
        mockMailchimCampaign({
          id: nanoid(),
          settings: {
            subject_line: `Daily Briefing - ${faker.lorem.sentence().substring(0, 50)}`,
          },
          long_archive_url: faker.internet.url(),
        }),
        mockMailchimCampaign({
          id: nanoid(),
          settings: {
            subject_line: `Daily Briefing - ${faker.lorem.sentence().substring(0, 50)}`,
          },
          long_archive_url: faker.internet.url(),
        }),
        mockMailchimCampaign({
          id: nanoid(),
          settings: {
            subject_line: `Daily Briefing - ${faker.lorem.sentence().substring(0, 50)}`,
          },
          long_archive_url: faker.internet.url(),
        }),
        mockMailchimCampaign({
          id: nanoid(),
          settings: {
            subject_line: `Daily Briefing - ${faker.lorem.sentence().substring(0, 50)}`,
          },
          long_archive_url: faker.internet.url(),
        }),
      ],
    }),
  ],
} as Meta;

const mockTabbedContentBlock = mockTabbedContentTeaserSlots();

export const TabbedMainTeaserSlots = {
  args: {
    ...mockTabbedContentBlock,
    blockStyle: TsriTabbedContentType.TabbedMainContent,
  },
};

const nestedBlocks = mockTabbedContentTeaserSlots().nestedBlocks;
// override block styles of first and last blocks...
nestedBlocks[nestedBlocks.length - 1].block!.blockStyle =
  TsriLayoutType.ArchiveTopic;
nestedBlocks[0].block!.blockStyle = TsriLayoutType.ArchiveTopicAuthor;
export const TabbedMainWithOverride = {
  args: {
    nestedBlocks,
    blockStyle: TsriTabbedContentType.TabbedMainContent,
  },
};

export const TabbedMainTeaserLists = {
  args: {
    ...TabbedMainTeaserSlots.args,
    nestedBlocks: [
      {
        alignment: mockFlexAlignment({
          h: 0,
          w: 0,
          x: 0,
          y: 0,
        }) as FlexAlignmentBlocks,
        block: mockTeaserListBlock({
          title: 'First Tab',
        }) as Maybe<BlockContent> | undefined,
      },
    ],
  },
};

const mockTabbedSidebarContentBlock = mockTabbedContentTeaserSlots({
  nestedBlocks: [
    {
      alignment: mockFlexAlignment({
        h: 0,
        w: 0,
        x: 0,
        y: 0,
      }) as FlexAlignmentBlocks,
      block: mockTeaserSlotsBlock({
        teasers: [mockArticleTeaser()],
      }) as Maybe<BlockContent> | undefined,
    },
    {
      alignment: mockFlexAlignment({
        h: 0,
        w: 0,
        x: 0,
        y: 0,
      }) as FlexAlignmentBlocks,
      block: mockTeaserSlotsBlock({
        title: 'Briefing',
        teasers: [
          mockCustomTeaser(),
          mockCustomTeaser({
            preTitle: 'Kostenlos abonnieren!',
            title: 'Das Wichtigste aus Zürich',
            lead: 'Lorem ipsum dolor sit amet, consectetur adipiscing elited do eiusmod Lorem ipsum dolor sit amet, consectetur adipiscing elited do eiusmod Lorem ipsum dolor sit',
            contentUrl: 'https://wepublish.ch',
          }),
        ],
      }) as Maybe<BlockContent> | undefined,
    },
    {
      alignment: mockFlexAlignment({
        h: 0,
        w: 0,
        x: 0,
        y: 0,
      }) as FlexAlignmentBlocks,
      block: mockTeaserSlotsBlock({
        title: 'Fokusmonat',
        teasers: [
          mockEventTeaser({
            title:
              '#Pitch-Night Kreislaufwirtschaft: Lorem consectetur adipiscing do in West',
          }),
          mockEventTeaser({
            title:
              '#Podium: Lorem ipsum dolor sit amet, consectetur adipiscing do eiusmod',
          }),
          mockEventTeaser({
            title:
              '#Party: Lorem ipsum dolor sit amet, consectetur adipiscing do eiusmod',
          }),
          mockCustomTeaser({
            title: 'Kreislaufwirtschaft',
            lead: 'Unsere Events rund ums Thema Kreislauf-wirtschaft lia cum rem fugit es doluptur ratis ma dolorem numquo to excea illam ra voluptis endanis deris seque por aciaeri busciti scimin porum aliquid ut esti.',
            preTitle: 'Alles zu Civic Media',
            contentUrl: 'https://wepublish.ch/events/kreislaufwirtschaft',
          }),
        ] as CustomTeaser[],
      }) as Maybe<BlockContent> | undefined,
    },
    {
      alignment: mockFlexAlignment({
        h: 0,
        w: 0,
        x: 0,
        y: 0,
      }) as FlexAlignmentBlocks,
      block: mockTeaserSlotsBlock({
        title: 'Shop',
        teasers: [
          mockCustomTeaser({
            title: 'Tsüri Lette',
            lead: 'Der Sommer ist da! Adilette, obere Lette, undere Lette, ... cheggsch? CHF 39.00',
            contentUrl: 'https://shop.tsri.ch/products/tsuri-lette-1',
          }),
          mockCustomTeaser({
            title: 'Tsüri Lette',
            lead: 'Der Sommer ist da! Adilette, obere Lette, undere Lette, ... cheggsch? CHF 39.00',
            contentUrl: 'https://shop.tsri.ch/products/tsuri-lette-1',
          }),
          mockCustomTeaser({
            title: 'Tsüri Lette',
            lead: 'Der Sommer ist da! Adilette, obere Lette, undere Lette, ... cheggsch? CHF 39.00',
            contentUrl: 'https://shop.tsri.ch/products/tsuri-lette-1',
          }),
          mockCustomTeaser({
            preTitle: 'Zum Shop',
            contentUrl: 'https://shop.tsri.ch/',
          }),
        ] as CustomTeaser[],
      }) as Maybe<BlockContent> | undefined,
    },
  ],
});
export const HeroTeaserTabbedSidebar = {
  args: {
    ...mockTabbedSidebarContentBlock,
    blockStyle: TsriTabbedContentType.HeroTeaserWithTabbedSidebarContent,
  },
};

export const HeroTeaserTabbedWithLove = {
  args: {
    nestedBlocks: [
      mockTabbedSidebarContentBlock.nestedBlocks![0],
      mockTabbedSidebarContentBlock.nestedBlocks![1],
      {
        alignment: mockFlexAlignment({
          h: 0,
          w: 0,
          x: 0,
          y: 0,
        }) as FlexAlignmentBlocks,
        block: mockTeaserSlotsBlock({
          title: 'Tsüri-Love',
          blockStyle: TsriLayoutType.TsriLove,
          teasers: [
            mockArticleTeaser({
              title: 'Die sieben besten Restaurants gemäss der Tsüri-Community',
            }),
            mockArticleTeaser({
              title:
                'Fünf Mountainbike Trails und Touren in und rund um Zürich',
            }),
            mockArticleTeaser({
              title: 'Sieben Tipps, wie du deine Wohnung kühl hältst',
            }),
            mockArticleTeaser({
              title: 'Die acht schönsten Restaurant-Terrassen Zürichs',
            }),
            mockCustomTeaser({
              title: 'Das Wichtigste aus Zürich',
              lead: 'Lorem ipsum dolor sit amet, consectetur adipiscing elited do eiusmod Lorem ipsum dolor sit amet, consectetur adipiscing.',
              preTitle: 'Noch mehr Tipps',
              contentUrl: 'https://wepublish.ch/events/kreislaufwirtschaft',
            }),
          ] as CustomTeaser[],
        }) as Maybe<BlockContent> | undefined,
      },
      mockTabbedSidebarContentBlock.nestedBlocks![3],
    ],
    blockStyle: TsriTabbedContentType.HeroTeaserWithTabbedSidebarContent,
  },
};
