import type {
  BuilderCommentBlockProps,
  BuilderCrowdfundingBlockProps,
  BuilderEventBlockProps,
  BuilderPollBlockProps,
} from '@wepublish/website/builder';

import {
  TeaserAuthorsRender,
  TeaserDateRender,
  TeaserImageRender,
  TeaserLeadRender,
  TeaserPreTitleRender,
  TeaserTagsRender,
  TeaserTitleRender,
} from '../teaser/teaser.render';
import { CommentRender } from './comment/comment.render';
import { CrowdfundingRender } from './crowdfunding/crowdfunding.render';
import { DataBlockProps, dataBlockRegistry } from './data.registry';
import { EventRender } from './event/event.component';
import { PollRender } from './poll/poll.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

describe('dataBlockRegistry', () => {
  it('renders every data block through its website render', () => {
    expect(dataBlockRegistry).toEqual({
      Comment: { component: CommentRender },
      Crowdfunding: { component: CrowdfundingRender },
      Poll: { component: PollRender },
      Event: { component: EventRender },
      TeaserTitle: { component: TeaserTitleRender },
      TeaserPreTitle: { component: TeaserPreTitleRender },
      TeaserLead: { component: TeaserLeadRender },
      TeaserImage: { component: TeaserImageRender },
      TeaserAuthors: { component: TeaserAuthorsRender },
      TeaserDate: { component: TeaserDateRender },
      TeaserTags: { component: TeaserTagsRender },
    });
  });

  it('stores the builder props of the placeholder blocks unchanged', () => {
    expectTypeOf<
      DataBlockProps['Comment']
    >().toEqualTypeOf<BuilderCommentBlockProps>();
    expectTypeOf<
      DataBlockProps['Crowdfunding']
    >().toEqualTypeOf<BuilderCrowdfundingBlockProps>();
    expectTypeOf<
      DataBlockProps['Poll']
    >().toEqualTypeOf<BuilderPollBlockProps>();
  });

  it('takes the events from data, not from the stored props', () => {
    expectTypeOf<DataBlockProps['Event']>().toEqualTypeOf<
      Omit<BuilderEventBlockProps, 'events' | 'className'>
    >();
  });

  it('stores no class name for the teaser blocks', () => {
    expectTypeOf<keyof DataBlockProps['TeaserTitle']>().toEqualTypeOf<never>();
    expectTypeOf<
      keyof DataBlockProps['TeaserDate']
    >().toEqualTypeOf<'showTime'>();
    expectTypeOf<keyof DataBlockProps['TeaserTags']>().toEqualTypeOf<'max'>();
  });
});
