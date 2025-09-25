import { Meta } from '@storybook/react';

import { H1, H2, H3, H4, H5, H6, Paragraph } from './typography';

export default {
  title: 'UI/Typography',
} as Meta;

export const Default = {
  render: () => (
    <>
      <H1>H1</H1>
      <H2>H2</H2>
      <H3>H3</H3>
      <H4>H4</H4>
      <H5>H5</H5>
      <H6>H6</H6>

      <Paragraph>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </Paragraph>
    </>
  ),
};

export const Styling = {
  render: () => (
    <>
      <H1 component="h6">H6 with styling of H1</H1>
      <H2 component="h5">H5 with styling of H2</H2>
      <H3 component="h4">H4 with styling of H3</H3>
      <H4 component="h3">H3 with styling of H4</H4>
      <H5 component="h2">H2 with styling of H5</H5>
      <H6 component="h1">H1 with styling of H6</H6>

      <Paragraph component={'strong'}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </Paragraph>
    </>
  ),
};
