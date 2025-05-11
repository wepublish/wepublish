import {ApolloError} from '@apollo/client'
import {Meta} from '@storybook/react'
import {PeerQuery} from '@wepublish/website/api'
import {PeerInformation} from './peer-information'
import {mockImage, mockRichText} from '@wepublish/storybook/mocks'

const peer = {
  id: 'clftnfuzh204501muj13hwvcu',
  name: 'test demo',
  slug: 'test-demo',
  isDisabled: false,
  hostURL: 'https://api.demo.wepublish.media/v1/admin',
  profile: {
    name: 'We.Publish',
    hostURL: 'https://api.demo.wepublish.media',
    themeColor: '#000000',
    themeFontColor: '#ffffff',
    logo: mockImage(),
    callToActionText: mockRichText(),
    callToActionURL: 'https://demo.wepublish.media/',
    callToActionImage: mockImage(),
    callToActionImageURL: 'https://demo.wepublish.media/',
    websiteURL: 'https://demo.wepublish.media/',
    __typename: 'PeerProfile'
  },
  createdAt: '2023-01-01',
  modifiedAt: '2023-01-01',
  __typename: 'Peer'
} as NonNullable<PeerQuery['peer']>

export default {
  component: PeerInformation,
  title: 'Components/Peer Information'
} as Meta

export const Default = {
  args: {
    originUrl: 'https://example.com',
    data: {
      peer
    }
  }
}

export const WithoutCtaUrl = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      peer: {
        ...peer,
        profile: {
          ...peer.profile,
          callToActionURL: null
        }
      }
    }
  }
}

export const WithoutCtaText = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      peer: {
        ...peer,
        profile: {
          ...peer.profile,
          callToActionText: null
        }
      }
    }
  }
}

export const WithLoading = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      peer: null
    },
    loading: true
  }
}

export const WithError = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      peer: null
    },
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}
