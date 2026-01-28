import { Meta } from '@storybook/react';
import { Banner } from './banner';
import { ApolloError } from '@apollo/client';
import { mockImage } from '@wepublish/storybook/mocks';

const banner = {
  id: '16ca80ce-a2d0-44dc-8c87-b735e4b08877',
  title: 'Bla',
  text: 'We need money. You are our only hope.',
  cta: 'Subscribe now!',
  active: true,
  showOnArticles: true,
  actions: [{ label: 'Foo' }, { label: 'Bar' }],
  image: mockImage(),
};

export default {
  component: Banner,
  title: 'Components/Banner',
} as Meta;

export const Default = {
  args: {
    data: { primaryBanner: banner },
  },
};

export const WithLoading = {
  args: {
    data: undefined,
    loading: true,
  },
};

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar',
    }),
  },
};

export const WithoutImage = {
  args: {
    data: {
      primaryBanner: { ...banner, image: null },
    },
  },
};
