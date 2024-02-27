import {styled} from '@mui/material'
import {ApiV1, PageContainer} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'

import {SliderContainer} from '../components/website-builder-overwrites/blocks/teaser-slider/teaser-slider'

const Homepage = styled(PageContainer)`
  grid-column: -1/1;
  gap: ${({theme}) => theme.spacing(3)};

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
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
