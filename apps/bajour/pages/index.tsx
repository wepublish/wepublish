import styled from '@emotion/styled'
import {ContentWidthProvider, SliderWrapper} from '@wepublish/website'
import {ApiV1, PageContainer} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'

import {BestOfWePublishWrapper} from '../src/components/best-of-wepublish/best-of-wepublish'
import {isFrageDesTages} from '../src/components/frage-des-tages/is-frage-des-tages'

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

    ${SliderWrapper} {
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
  return (
    <ContentWidthProvider fullWidth>
      <Homepage slug={'home'} />
    </ContentWidthProvider>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.API_URL) {
    return {props: {}, revalidate: 1}
  }

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL, [])

  const [page] = await Promise.all([
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
    }),
    client.query({
      query: ApiV1.SettingListDocument
    })
  ])

  const fdTTeaser = page.data?.page?.blocks.find((block: ApiV1.Block) => {
    return isFrageDesTages(block)
  }) as ApiV1.TeaserListBlock | undefined

  if (fdTTeaser && fdTTeaser.teasers[0]) {
    let id: string | undefined

    switch (fdTTeaser.teasers[0].__typename) {
      case 'ArticleTeaser': {
        id = fdTTeaser.teasers[0].article?.id
        break
      }
      case 'PageTeaser': {
        id = fdTTeaser.teasers[0].page?.id
        break
      }
    }

    if (id) {
      await client.query({
        query: ApiV1.CommentListDocument,
        variables: {
          sort: ApiV1.CommentSort.Rating,
          order: ApiV1.SortOrder.Descending,
          itemId: id
        }
      })
    }
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
