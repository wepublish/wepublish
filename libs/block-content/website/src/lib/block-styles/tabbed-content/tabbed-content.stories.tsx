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
  NestedBlock,
  FlexAlignmentBlocks,
  BlockContent,
  Maybe,
} from '@wepublish/website/api';

export default {
  component: TabbedContent,
  title: 'Blocks/Flex Block/Block Styles/Tabbed Content',
} as Meta;

type MockTabbedContentBlock = (args?: {
  blockStyle?: string;
  nestedBlocks?: NestedBlock[];
  type?: BlockType;
}) => FlexBlock;

const mockTabbedContentBlock: MockTabbedContentBlock = (
  args = {}
): FlexBlock => {
  const {
    blockStyle = 'TabbedContent',
    nestedBlocks = [
      {
        alignment: mockFlexAlignment({
          h: 0,
          w: 0,
          x: 0,
          y: 0,
        }) as FlexAlignmentBlocks,
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
        }) as FlexAlignmentBlocks,
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
        }) as FlexAlignmentBlocks,
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
        }) as FlexAlignmentBlocks,
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
        }) as FlexAlignmentBlocks,
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
        }) as FlexAlignmentBlocks,
        block: mockTeaserSlotsBlock({
          title: 'Sixth Tab',
        }) as Maybe<BlockContent> | undefined,
      },
    ],
    type = BlockType.FlexBlock,
  } = args;

  return {
    blockStyle,
    nestedBlocks,
    type,
  };
};

export const Default = {
  args: mockTabbedContentBlock(),
};

export const WithTeaserLists = {
  args: mockTabbedContentBlock({
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
  }),
};
