import { Meta, StoryObj } from '@storybook/nextjs';
import { CommentBlock } from './comment-block';
import { mockCommentBlock } from '@wepublish/storybook/mocks';

export default {
  component: CommentBlock,
  title: 'Blocks/Comment',
} as Meta;

export const Comment: StoryObj = {
  args: mockCommentBlock(),
};
