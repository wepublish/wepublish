import {styled} from '@mui/material'
import {ApiV1, PageContainer} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'

import {BestOfWePublishWrapper} from '../src/components/bajour/best-of-wepublish/best-of-wepublish'
import {SliderContainer} from '../src/components/website-builder-overwrites/blocks/teaser-slider/teaser-slider'

const Homepage = styled(PageContainer)`
  grid-column: -1/1;
  gap: ${({theme}) => theme.spacing(3)};

  ${BestOfWePublishWrapper} {
    padding-left: calc(100% / 24);
    padding-right: calc(100% / 24);
  }

  ${({theme}) => theme.breakpoints.up('sm')} {
    gap: ${({theme}) => theme.spacing(6)};
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    gap: ${({theme}) => theme.spacing(5)};

    ${SliderContainer} {
      padding-left: calc(100% / 12);
      padding-right: calc(100% / 12);
    }
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    grid-column: 2/3;

    ${BestOfWePublishWrapper} {
      padding: 0;
    }
  }

  ${({theme}) => theme.breakpoints.up('xl')} {
    gap: ${({theme}) => theme.spacing(10)};
  }
`

export default function Index() {
  return <Homepage slug={'home'} />
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.API_URL) {
    return {props: {}, revalidate: 1}
  }

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL, [])

  await Promise.all([
    client.query({
      query: ApiV1.PageDocument,
      variables: {
        slug: 'home'
      }
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
