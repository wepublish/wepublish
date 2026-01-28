import { Meta } from '@storybook/react';
import { PeerInformation } from './peer-information';
import { mockPeer, mockRemotePeerProfile } from '@wepublish/storybook/mocks';

export default {
  component: PeerInformation,
  title: 'Components/Peer Information',
} as Meta;

export const Default = {
  args: {
    originUrl: 'https://example.com',
    ...mockPeer(),
  },
};

export const WithoutCtaUrl = {
  ...Default,
  args: {
    originUrl: 'https://example.com',
    ...mockPeer({
      profile: mockRemotePeerProfile({
        callToActionURL: '',
      }),
    }),
  },
};

export const WithoutCtaText = {
  ...Default,
  args: {
    originUrl: 'https://example.com',
    ...mockPeer({
      profile: mockRemotePeerProfile({
        callToActionText: [],
      }),
    }),
  },
};
