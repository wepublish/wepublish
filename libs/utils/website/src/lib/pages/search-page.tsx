import styled from '@emotion/styled'
import {zodResolver} from '@hookform/resolvers/zod'
import {CircularProgress} from '@mui/material'
import {articleToTeaser} from '@wepublish/article/website'
import {
  addClientCacheToV1Props,
  Article,
  getV1ApiClient,
  NavigationListDocument,
  Page,
  PageTeaser,
  PeerProfileDocument,
  TeaserType,
  usePhraseQuery
} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {MdSearch} from 'react-icons/md'
import {z} from 'zod'

const SearchForm = styled('form')`
  display: grid;
  align-items: center;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: 1fr max-content;
`

const SearchPageWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};
`

const pageToTeaser = (page: Page): PageTeaser => ({
  __typename: 'PageTeaser',
  type: TeaserType.Page,
  page,
  image: null,
  lead: null,
  preTitle: null,
  title: null
})

const ITEMS_PER_PAGE = 12

const searchPageSchema = z.object({
  page: z.coerce.number().gte(1).default(1),
  q: z.string().default('')
})

export const SearchPage = () => {
  const {
    blocks: {TeaserGrid},
    elements: {IconButton, TextField, Pagination, Alert}
  } = useWebsiteBuilder()

  const router = useRouter()
  const {query} = router
  const {page, q: phraseQuery} = searchPageSchema.parse(query)

  const {control, handleSubmit} = useForm<z.infer<typeof searchPageSchema>>({
    resolver: zodResolver(searchPageSchema),
    defaultValues: {
      q: phraseQuery,
      page: 1
    }
  })

  const {
    data: phraseData,
    loading,
    error
  } = usePhraseQuery({
    skip: !phraseQuery,
    variables: {
      query: phraseQuery,
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE
    }
  })

  const totalArticlesCount = phraseData?.phrase?.articles?.totalCount ?? 0
  const totalPagesCount = phraseData?.phrase?.pages?.totalCount ?? 0

  const pageCount = Math.ceil(Math.max(totalArticlesCount, totalPagesCount) / ITEMS_PER_PAGE)
  const teasers = useMemo(() => {
    if (!phraseData?.phrase) {
      return []
    }

    const articleTeasers = phraseData.phrase.articles.nodes.map(node =>
      articleToTeaser(node as Article)
    )
    const pageTeasers = phraseData.phrase.pages.nodes.map(node => pageToTeaser(node as Page))

    return [...articleTeasers, ...pageTeasers]
  }, [phraseData?.phrase])

  const noResultsFound = !teasers.length && !loading && !error && phraseQuery

  return (
    <SearchPageWrapper>
      <SearchForm
        onSubmit={handleSubmit(({q}) =>
          router.push({
            query: {q}
          })
        )}>
        <Controller
          name={'q'}
          control={control}
          render={({field}) => (
            <TextField
              type="search"
              autoComplete="search"
              label="Artikelsuche"
              fullWidth
              {...field}
            />
          )}
        />

        <IconButton type="submit" aria-label="Artikelsuche">
          <MdSearch size={28} />
        </IconButton>
      </SearchForm>

      {loading && <CircularProgress sx={{justifySelf: 'center'}} size={48} />}
      {error && <Alert severity="error">{error.message}</Alert>}
      {noResultsFound && <Alert severity="info">Keine Suchergebnisse gefunden</Alert>}

      <TeaserGrid numColumns={3} teasers={teasers} />

      {!!teasers.length && (
        <Pagination
          page={page}
          count={pageCount}
          onChange={(_, value) =>
            router.push({
              query: {page: value, q: phraseQuery}
            })
          }
        />
      )}
    </SearchPageWrapper>
  )
}

export const SearchPageGetStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.API_URL) {
    return {props: {}, revalidate: 1}
  }

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, [])
  await Promise.all([
    client.query({
      query: NavigationListDocument
    }),
    client.query({
      query: PeerProfileDocument
    })
  ])

  const props = addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
