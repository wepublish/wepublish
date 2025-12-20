import { Meta } from '@storybook/react';
import { TabbedContent } from './tabbed-content';
import {
  mockTeaserSlotsBlock,
  mockFlexAlignment,
  mockTeaserListBlock,
} from '@wepublish/storybook/mocks';
import {
  BlockType,
  FlexBlock,
  BlockWithAlignment,
  FlexAlignment,
  BlockContent,
  Maybe,
} from '@wepublish/website/api';

export default {
  component: TabbedContent,
  title: 'Blocks/Flex Block/Block Styles/Tabbed Content',
} as Meta;

type MockTabbedContentBlock = (args?: {
  blockStyle?: string;
  blocks?: BlockWithAlignment[];
  type?: BlockType;
}) => FlexBlock;

const mockTabbedContentBlock: MockTabbedContentBlock = (
  args = {}
): FlexBlock => {
  const {
    blockStyle = 'TabbedContent',
    blocks = [
      {
        alignment: mockFlexAlignment({
          h: 0,
          w: 0,
          x: 0,
          y: 0,
        }) as FlexAlignment,
        block: mockTeaserSlotsBlock({
          title: 'First Tab',
        }) as Maybe<BlockContent> | undefined,
      },
      {
        alignment: mockFlexAlignment({
          h: 0,
          w: 0,
          x: 0,
          y: 0,
        }) as FlexAlignment,
        block: mockTeaserSlotsBlock({
          title: 'Second Tab',
        }) as Maybe<BlockContent> | undefined,
      },
      {
        alignment: mockFlexAlignment({
          h: 0,
          w: 0,
          x: 0,
          y: 0,
        }) as FlexAlignment,
        block: mockTeaserSlotsBlock({
          title: 'Third Tab',
        }) as Maybe<BlockContent> | undefined,
      },
      {
        alignment: mockFlexAlignment({
          h: 0,
          w: 0,
          x: 0,
          y: 0,
        }) as FlexAlignment,
        block: mockTeaserSlotsBlock({
          title: 'Fourth Tab',
        }) as Maybe<BlockContent> | undefined,
      },
      {
        alignment: mockFlexAlignment({
          h: 0,
          w: 0,
          x: 0,
          y: 0,
        }) as FlexAlignment,
        block: mockTeaserSlotsBlock({
          title: 'Fifth Tab',
        }) as Maybe<BlockContent> | undefined,
      },
      {
        alignment: mockFlexAlignment({
          h: 0,
          w: 0,
          x: 0,
          y: 0,
        }) as FlexAlignment,
        block: mockTeaserSlotsBlock({
          title: 'Sixth Tab',
        }) as Maybe<BlockContent> | undefined,
      },
    ],
    type = BlockType.FlexBlock,
  } = args;

  return {
    blockStyle,
    blocks,
    type,
  };
};

export const Default = {
  args: mockTabbedContentBlock(),
};

export const WithTeaserLists = {
  args: mockTabbedContentBlock({
    blocks: [
      {
        alignment: mockFlexAlignment({
          h: 0,
          w: 0,
          x: 0,
          y: 0,
        }) as FlexAlignment,
        block: mockTeaserListBlock({
          title: 'First Tab',
        }) as Maybe<BlockContent> | undefined,
      },
    ],
  }),
};
