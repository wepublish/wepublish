import styled from '@emotion/styled';
import { Meta, StoryFn } from '@storybook/react';
import { Blocks } from './blocks';
import { mockBlockContent } from '@wepublish/storybook/mocks';

export default {
  component: Blocks,
  title: 'Blocks/Blocks',
} as Meta;

const blocks = mockBlockContent();

export const Default = {
  args: {
    blocks,
  },
};

const Layout = styled.div`
  display: grid;
  gap: 24px;
`;

const LayoutTemplate: StoryFn<typeof Blocks> = args => (
  <Layout>
    <Blocks {...args} />
  </Layout>
);

export const WithLayout = {
  render: LayoutTemplate,

  args: {
    blocks,
  },
};
