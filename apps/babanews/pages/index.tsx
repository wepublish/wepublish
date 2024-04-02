import {css, styled} from '@mui/material'
import {
  ApiV1,
  PageContainer,
  TeaserDate,
  TeaserGridFlexBlockWrapper,
  TeaserWrapper
} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'

const Frontpage = styled(PageContainer)`
  gap: ${({theme}) => theme.spacing(6)};
  padding-bottom: ${({theme}) => theme.spacing(6)};
  ${TeaserGridFlexBlockWrapper}:first-of-type
  ${TeaserWrapper}:first-of-type {
    ${TeaserDate} {
      font-size: ${({theme}) => theme.typography.h6.fontSize};
      text-transform: uppercase;
    }

    h1 {
      font-size: ${({theme}) => theme.typography.h4.fontSize};
      font-weight: ${({theme}) => theme.typography.h4.fontWeight};

      ${({theme}) => css`
        ${theme.breakpoints.up('md')} {
          font-size: ${theme.typography.h3.fontSize};
          font-weight: ${theme.typography.h3.fontWeight};
        }
      `}
    }
  }
`

export default function Index() {
  return <Frontpage slug={''} />
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
        slug: ''
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
