import {Box, css, Skeleton, styled} from '@mui/material'
import {articleToTeaser} from '@wepublish/article/website'
import {alignmentForTeaserBlock} from '@wepublish/block-content/website'
import {Article} from '@wepublish/website/api'
import {Teaser, usePhraseLazyQuery} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {useRouter} from 'next/router'
import {FormEvent, useEffect, useMemo, useRef, useState} from 'react'

import {MannschaftBaseTeaser} from '../src/mannschaft-base-teaser'

export const SearchForm = styled('form')`
  display: grid;
  grid-template-columns: auto auto;
  gap: ${({theme}) => theme.spacing(1)};
`

export const SearchResultsContainer = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({theme}) => theme.spacing(2)};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(2, 1fr);
    }
  `}

  ${({theme}) => css`
    ${theme.breakpoints.up('lg')} {
      grid-template-columns: repeat(3, 1fr);
    }
  `}
`

const ITEMS_PER_PAGE = 12

export default function Search() {
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined)
  const [page, setPage] = useState<number>(1)

  const router = useRouter()
  const {
    elements: {Button, TextField, Pagination}
  } = useWebsiteBuilder()

  const [searchRequest, {error, data, loading}] = usePhraseLazyQuery()

  function search(e: FormEvent) {
    e?.preventDefault()
    // reset page
    setPage(1)
    router.push({
      pathname: '/search',
      query: {q: searchTerm}
    })
  }

  function changePage(newPage: number) {
    setPage(newPage)
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const searchQuery: string | undefined = (router.query.q as string) || undefined
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  })

  useEffect(() => {
    setSearchTerm(searchQuery)
    if (!searchQuery) return
    searchRequest({
      variables: {
        query: searchQuery,
        take: ITEMS_PER_PAGE,
        skip: (page - 1) * ITEMS_PER_PAGE
      }
    })
  }, [searchQuery, page])

  const teasers = useMemo(() => {
    const articles = data?.phrase?.articles?.nodes || ([] as Article[])
    return articles.map(article => articleToTeaser(article as Article))
  }, [data])

  const count = useMemo(
    () => Math.ceil((data?.phrase?.articles?.totalCount || 0) / ITEMS_PER_PAGE),
    [data]
  )

  return (
    <>
      <SearchForm onSubmit={search}>
        <TextField
          value={searchTerm}
          name="search"
          type="text"
          label="Suche"
          onChange={event => setSearchTerm(event.target.value)}
          inputRef={inputRef}
        />
        <Button onClick={search} disabled={loading}>
          {loading ? 'Suche läuft...' : 'Suche'}
        </Button>
      </SearchForm>

      {loading && (
        <h1>
          Suche nach <i>{searchQuery}</i> läuft...
        </h1>
      )}

      {error && (
        <div>
          <h1>Bei der Suche ist ein Fehler aufgetreten</h1>
          <i>{error.message}</i>
          <p>Versuch es doch mit einem anderen Suchbegriff</p>
        </div>
      )}

      {teasers.length === 0 && !loading && !!searchQuery && (
        <h1>Wir haben keine passenden Artikel zu deiner Suche gefunden.</h1>
      )}

      <SearchResultsContainer>
        {loading && (
          <>
            {[1, 2, 3].map(index => (
              <Box key={index}>
                <Skeleton variant="rectangular" width="100%">
                  <div style={{paddingTop: '60%'}} />
                </Skeleton>
              </Box>
            ))}
          </>
        )}

        {teasers.map((teaser, teaserIndex) => (
          <div key={teaserIndex}>
            <MannschaftBaseTeaser
              teaser={teaser as Teaser}
              blockStyle=""
              alignment={alignmentForTeaserBlock(teaserIndex, 1)}
            />
          </div>
        ))}
      </SearchResultsContainer>

      {!loading && !error && teasers.length > 0 && (
        <Pagination count={count} page={page} onChange={(_, value) => changePage(value)} />
      )}
    </>
  )
}
