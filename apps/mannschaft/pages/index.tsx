import {css, GlobalStyles, Theme} from '@mui/material'
import {useTheme} from '@mui/material'
import {
  ApiV1,
  ContentWidthProvider,
  PageContainer,
  PageWrapper,
  WebsiteBuilderProvider
} from '@wepublish/website'
import {BuilderBlockRendererProps, isBreakBlock} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {cond} from 'ramda'
import {useMemo} from 'react'

import {MainSpacer} from '../src/main-spacer'
import {MannschaftBlockRenderer} from '../src/mannschaft-block-renderer'

export const FullWidthBlockRenderer = (props: BuilderBlockRendererProps) => {
  const theme = useTheme()

  const bg = useMemo(() => cond([[isBreakBlock, () => theme.palette.accent.main]]), [theme])

  return (
    <MainSpacer maxWidth="lg" bg={bg(props.block)}>
      <MannschaftBlockRenderer {...props} />
    </MainSpacer>
  )
}

const fullWidthMainSpacer = (theme: Theme) => css`
  main > .MuiContainer-root {
    max-width: initial;
    padding: 0;
  }

  ${PageWrapper} > .MuiContainer-root {
    max-width: initial;
    grid-template-columns: minmax(auto, ${theme.breakpoints.values['lg']}px);
    justify-content: center;
  }
`

export default function Index() {
  return (
    <WebsiteBuilderProvider blocks={{Renderer: FullWidthBlockRenderer}}>
      <ContentWidthProvider fullWidth>
        <GlobalStyles styles={fullWidthMainSpacer} />

        <PageContainer slug={''} />
      </ContentWidthProvider>
    </WebsiteBuilderProvider>
  )
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
