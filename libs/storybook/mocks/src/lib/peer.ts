import { FullPeerFragment, RemotePeerProfile } from '@wepublish/website/api';
import nanoid from 'nanoid';
import { mockRichText } from './richtext';
import { mockPeerImage } from './image';

export const mockRemotePeerProfile = ({
  callToActionText = mockRichText(),
  callToActionURL = 'https://example.com',
  hostURL = 'https://example.com',
  websiteURL = 'https://example.com',
  callToActionImage = mockPeerImage(),
  callToActionImageURL = mockPeerImage().url,
  logo = mockPeerImage(),
  squareLogo = mockPeerImage(),
  name = 'Peer',
  themeColor = '#faa',
  themeFontColor = '#000',
}: Partial<RemotePeerProfile> = {}): RemotePeerProfile => ({
  __typename: 'RemotePeerProfile',
  callToActionText,
  callToActionURL,
  hostURL,
  websiteURL,
  callToActionImage,
  callToActionImageURL,
  logo,
  squareLogo,
  name,
  themeColor,
  themeFontColor,
});

export const mockPeer = ({
  name = 'Peer',
  slug = 'peer-slug',
  profile = mockRemotePeerProfile(),
  isDisabled = false,
}: Partial<FullPeerFragment> = {}): FullPeerFragment => ({
  __typename: 'Peer',
  id: nanoid(),
  name,
  slug,
  profile,
  isDisabled,
  createdAt: new Date('2023-01-01').toISOString(),
  modifiedAt: new Date('2023-01-01').toISOString(),
  hostURL: 'https://example.com',
});
