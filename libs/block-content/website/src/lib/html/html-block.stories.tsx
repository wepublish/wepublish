import { Meta } from '@storybook/react';
import { HtmlBlock } from './html-block';

export default {
  component: HtmlBlock,
  title: 'Blocks/HTML',
} as Meta;

export const Default = {
  args: {
    html: '<div style="color: red;">This is a html embed</div>',
  },
};

export const WithScript = {
  args: {
    html: `
      <div style="color: red;">Checkout your console.</div>
      <script>console.log("This is a html embed")</script>
    `,
  },
};

export const Empty = {
  args: {
    html: ``,
  },
};
