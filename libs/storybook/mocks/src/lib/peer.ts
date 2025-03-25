import {FullPeerFragment, PeerProfile} from '@wepublish/website/api'
import nanoid from 'nanoid'
import {mockRichText} from './richtext'
import {mockImage} from './image'

export const mockPeerProfile = ({
  callToActionText = mockRichText(),
  callToActionURL = 'https://example.com',
  hostURL = 'https://example.com',
  websiteURL = 'https://example.com',
  callToActionImage = mockImage(),
  callToActionImageURL = mockImage().url,
  logo = mockImage(),
  name = 'Peer',
  themeColor = '#faa',
  themeFontColor = '#000'
}: Partial<PeerProfile> = {}): PeerProfile => ({
  __typename: 'PeerProfile',
  callToActionText,
  callToActionURL,
  hostURL,
  websiteURL,
  callToActionImage,
  callToActionImageURL,
  logo,
  name,
  themeColor,
  themeFontColor
})

export const mockPeer = ({
  name = 'Peer',
  slug = 'peer-slug',
  profile = mockPeerProfile(),
  isDisabled = false
}: Partial<FullPeerFragment> = {}): FullPeerFragment => ({
  __typename: 'Peer',
  id: nanoid(),
  name,
  slug,
  profile,
  isDisabled,
  createdAt: new Date('2023-01-01').toISOString(),
  modifiedAt: new Date('2023-01-01').toISOString(),
  hostURL: 'https://example.com'
})
