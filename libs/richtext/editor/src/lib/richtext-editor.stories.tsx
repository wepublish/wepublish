import { Meta, StoryObj } from '@storybook/nextjs';
import { action } from 'storybook/actions';
import { RichtextEditor } from './richtext-editor';
import { mockRichText } from '@wepublish/storybook/mocks';

export default {
  component: RichtextEditor,
  title: 'Richtext/Editor',
} as Meta<typeof RichtextEditor>;

export const Default: StoryObj<typeof RichtextEditor> = {
  args: {
    onChange: (...args) => {
      action('onChange')(...args);
      console.log('onChange', ...args);
    },
    autofocus: true,
    defaultValue: mockRichText(),
  },
};
