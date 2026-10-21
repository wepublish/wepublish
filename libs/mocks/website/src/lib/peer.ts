import {
  FullPeerFragment,
  FullPeerProfileFragment,
  FullRemotePeerProfileFragment,
} from '@wepublish/website/api';
import { mockRichText } from './richtext';
import { mockImage, mockPeerImage } from './image';
import { faker, MOCK_REFERENCE_DATE } from './faker';
import { definedOnly } from './overrides';

export const mockRemotePeerProfile = ({
  callToActionText = mockRichText(),
  callToActionImage = mockPeerImage(),
  logo = mockPeerImage(),
  squareLogo = mockPeerImage(),
  ...overrides
}: Partial<FullRemotePeerProfileFragment> = {}): FullRemotePeerProfileFragment => ({
  __typename: 'RemotePeerProfile',
  name: 'Peer',
  themeColor: '#faa',
  themeFontColor: '#000',
  hostURL: 'https://example.com',
  websiteURL: 'https://example.com',
  callToActionURL: 'https://example.com',
  callToActionImageURL: 'https://unsplash.it/500/281',
  callToActionText,
  callToActionImage,
  logo,
  squareLogo,
  ...definedOnly(overrides),
});

export const mockPeerProfile = ({
  callToActionText = mockRichText(),
  callToActionImage = mockImage(),
  logo = mockImage(),
  squareLogo = mockImage(),
  ...overrides
}: Partial<FullPeerProfileFragment> = {}): FullPeerProfileFragment => ({
  __typename: 'PeerProfile',
  name: 'We.Publish',
  themeColor: '#faa',
  themeFontColor: '#000',
  hostURL: 'https://example.com',
  websiteURL: 'https://example.com',
  callToActionURL: 'https://example.com',
  callToActionImageURL: 'https://unsplash.it/500/281',
  callToActionText,
  callToActionImage,
  logo,
  squareLogo,
  ...definedOnly(overrides),
});

export const mockPeer = ({
  profile = mockRemotePeerProfile(),
  ...overrides
}: Partial<FullPeerFragment> = {}): FullPeerFragment => ({
  __typename: 'Peer',
  id: faker.string.nanoid(),
  name: 'Peer',
  slug: 'peer-slug',
  isDisabled: false,
  hostURL: 'https://example.com',
  information: null,
  createdAt: MOCK_REFERENCE_DATE,
  modifiedAt: MOCK_REFERENCE_DATE,
  profile,
  ...definedOnly(overrides),
});
