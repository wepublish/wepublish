import { Meta, StoryObj } from '@storybook/react';
import { mockRichText } from '@wepublish/storybook/mocks';
import { RenderRichtext } from './render-richtext';

export default {
  component: RenderRichtext,
  title: 'Richtext/Render',
} as Meta<typeof RenderRichtext>;

export const Default: StoryObj<typeof RenderRichtext> = {
  args: {
    document: mockRichText(),
  },
};
