import { faker } from '@faker-js/faker';
import { Meta } from '@storybook/react';
import {
  //mockArticleTeaser,
  mockMailchimCampaign,
  mockTeaserSlotsBlock,
} from '@wepublish/storybook/mocks';
import nanoid from 'nanoid';

import { WithMailchimpCampaignsDecorator } from '../../testing/mailchimp-campaigns.decorator';
import { WithWebsiteProviderDecorator } from '../../testing/with-website-builder-provider';
import { TsriBaseTeaserSlots } from './tsri-base-teaser-slots';
import { TsriLayoutType } from './tsri-layout';

export default {
  component: TsriBaseTeaserSlots,
  title: 'Tsri/Container/TeaserSlots',
  decorators: [
    WithWebsiteProviderDecorator,
    WithMailchimpCampaignsDecorator({
      campaigns: [
        mockMailchimCampaign({
          id: nanoid(),
          settings: {
            subject_line: `Daily Briefing - ${faker.lorem.sentence()}`,
          },
          long_archive_url: faker.internet.url(),
        }),
        mockMailchimCampaign({
          id: nanoid(),
          settings: {
            subject_line: `Daily Briefing - ${faker.lorem.sentence()}`,
          },
          long_archive_url: faker.internet.url(),
        }),
        mockMailchimCampaign({
          id: nanoid(),
          settings: {
            subject_line: `Daily Briefing - ${faker.lorem.sentence()}`,
          },
          long_archive_url: faker.internet.url(),
        }),
        mockMailchimCampaign({
          id: nanoid(),
          settings: {
            subject_line: `Daily Briefing - ${faker.lorem.sentence()}`,
          },
          long_archive_url: faker.internet.url(),
        }),
      ],
    }),
  ],
} as Meta;

const mockTeaserSlotsBlockData = mockTeaserSlotsBlock({
  blockStyle: '',
});

/*
(
  mockTeaserSlotsBlockData as typeof mockTeaserSlotsBlockData & {
    alignmentForTeaserBlock: (index: number) => FlexAlignment;
  }
).alignmentForTeaserBlock = alignmentForTeaserBlock;
*/

export const Default = {
  args: mockTeaserSlotsBlockData,
};

export const FullsizeImage = {
  args: { ...Default.args, blockStyle: TsriLayoutType.FullsizeImage },
};

export const NoImage = {
  args: { ...Default.args, blockStyle: TsriLayoutType.NoImage },
};

export const NoImageAltColor = {
  args: { ...Default.args, blockStyle: TsriLayoutType.NoImageAltColor },
};

export const TwoCol = {
  args: { ...Default.args, blockStyle: TsriLayoutType.TwoCol },
};

export const TwoColAltColor = {
  args: { ...Default.args, blockStyle: TsriLayoutType.TwoColAltColor },
};

export const ArchiveTopic = {
  args: { ...Default.args, blockStyle: TsriLayoutType.ArchiveTopic },
};

export const ArchiveTopicWithTwoCol = {
  args: { ...Default.args, blockStyle: TsriLayoutType.ArchiveTopicWithTwoCol },
};

export const ArchiveTopicAuthor = {
  args: { ...Default.args, blockStyle: TsriLayoutType.ArchiveTopicAuthor },
};

/*
const mockTeaserSlotsBlockData2 = mockTeaserSlotsBlock({
  title: 'test title',
  blockStyle: '',
  teasers: [
    mockArticleTeaser({ title: faker.lorem.sentence() }),

    mockArticleTeaser({ title: 'Briefing' }),
    mockArticleTeaser({ title: 'Fokusmonat' }),
    mockArticleTeaser({ title: 'Shop' }),

    mockArticleTeaser({ title: faker.lorem.sentence() }),
    mockArticleTeaser({ title: faker.lorem.sentence() }),
    mockArticleTeaser({ title: faker.lorem.sentence() }),

    mockArticleTeaser({ title: faker.lorem.sentence() }),
    mockArticleTeaser({ title: faker.lorem.sentence() }),
    mockArticleTeaser({ title: faker.lorem.sentence() }),
  ],
});
export const FrontTop = {
  args: { ...mockTeaserSlotsBlockData2, blockStyle: TsriLayoutType.FrontTop },
};

const mockTeaserSlotsBlockData3 = mockTeaserSlotsBlock({
  title: 'test title',
  blockStyle: '',
  teasers: [
    mockArticleTeaser({ title: faker.lorem.sentence() }),
    mockArticleTeaser({ title: 'Briefing' }),
    mockArticleTeaser({ title: 'Fokusmonat' }),
    mockArticleTeaser({ title: 'Shop' }),
  ],
});

export const FrontTopOneRow = {
  args: {
    ...mockTeaserSlotsBlockData3,
    blockStyle: TsriLayoutType.FrontTopOneRow,
  },
};
*/
