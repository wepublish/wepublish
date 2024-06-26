import {css, Pagination, styled, TextField} from '@mui/material'
import {Button} from '@wepublish/ui'
import {alignmentForTeaserBlock, ApiV1, articleToTeaser, Teaser} from '@wepublish/website'
import {useRouter} from 'next/router'
import {ChangeEvent, FormEvent, useEffect, useState} from 'react'
import {MdSearch} from 'react-icons/md'

export const SearchInput = styled(TextField)`
  width: 100%;
`

export const SearchForm = styled('form')`
  width: 90%;
  margin: 0 auto;
  display: flex;
  flex-wrap: nowrap;
`

export const SearchButton = styled(Button)`
  margin-left: ${({theme}) => theme.spacing(2)};
`

export const NavbarPhraseResultsWrapper = styled('div')`
  padding: ${({theme}) => theme.spacing(2.5)};
  margin-top: ${({theme}) => theme.spacing(6)};
  background-color: ${({theme}) => theme.palette.common.white};
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  overflow-y: scroll;
  padding-bottom: ${({theme}) => theme.spacing(10)};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(6)};
      row-gap: ${theme.spacing(12)};
      grid-template-columns: 1fr 1fr;
      padding: ${theme.spacing(2.5)} calc(100% / 6) calc(100% / 12);
    }
  `}
`

export const SearchPageWrapper = styled('div')`
  padding-top: ${({theme}) => theme.spacing(6)};
`

export const SearchStatus = styled('div')`
  margin: 0 auto;
  padding: ${({theme}) => theme.spacing(4)};
  text-align: center;
`

export const SearchPagination = styled(Pagination)`
  margin-top: ${({theme}) => theme.spacing(2)};
`

export const pageToTeaser = (page: ApiV1.Page): ApiV1.PageTeaser => ({
  __typename: 'PageTeaser',
  style: ApiV1.TeaserStyle.Default,
  page,
  image: null,
  lead: null,
  preTitle: null,
  title: null
})

const ITEMS_PER_PAGE = 5

const SearchPage: React.FC = () => {
  const router = useRouter()
  const {query} = router
  const [page, setPage] = useState(1)

  const phraseQuery = (query.q as string) || ''

  const {
    data: phraseData,
    loading,
    error
  } = ApiV1.usePhraseQuery({
    variables: {
      query: phraseQuery,
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE
    }
  })

  useEffect(() => {
    if (query.q) {
      setPage(1) // Reset page to 1 if the query changes
    }
  }, [query.q])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const target = e.target as typeof e.target & {
      elements: {search: {value: string}}
    }
    const rawQuery = target.elements.search.value
    router.push({
      pathname: '/search',
      query: {q: rawQuery}
    })
  }

  const handlePageChange = (event: ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const articlesNodes =
    (phraseData?.phrase && phraseData.phrase.articles && phraseData.phrase.articles.nodes) || []
  const pagesNodes =
    (phraseData?.phrase && phraseData.phrase.pages && phraseData.phrase.pages.nodes) || []

  const totalArticlesCount = phraseData?.phrase?.articles?.totalCount || 0
  const totalPagesCount = phraseData?.phrase?.pages?.totalCount || 0
  const totalCount = totalArticlesCount + totalPagesCount

  const modifiedArticlesNodes = articlesNodes.map(node => articleToTeaser(node as ApiV1.Article))
  const modifiedPagesNodes = pagesNodes.map(node => pageToTeaser(node as ApiV1.Page))

  const phraseResultTeasers = [...modifiedArticlesNodes, ...modifiedPagesNodes]

  const noResultsFound = phraseResultTeasers.length === 0 && !loading && !error && phraseQuery

  return (
    <SearchPageWrapper>
      <SearchForm onSubmit={handleSearch}>
        <SearchInput name="search" type="text" label="Artikelsuche" defaultValue={phraseQuery} />
        <SearchButton type="submit" aria-label="Artikelsuche">
          <MdSearch size={28} />
        </SearchButton>
      </SearchForm>

      {loading && <SearchStatus>Loading...</SearchStatus>}
      {error && <SearchStatus>Error: {error.message}</SearchStatus>}
      {noResultsFound && <SearchStatus>Keine Suchergebnisse gefunden</SearchStatus>}
      {phraseResultTeasers.length > 0 && (
        <>
          <NavbarPhraseResults teasers={phraseResultTeasers} />
          {totalCount > ITEMS_PER_PAGE && (
            <SearchPagination
              count={Math.ceil(totalCount / ITEMS_PER_PAGE)}
              page={page}
              onChange={handlePageChange}
            />
          )}
        </>
      )}
    </SearchPageWrapper>
  )
}

export const NavbarPhraseResults = ({teasers}: {teasers: ApiV1.Teaser[]}) => {
  return (
    <NavbarPhraseResultsWrapper>
      {teasers.map((teaser, index) => {
        return (
          <Teaser
            key={index}
            teaser={teaser}
            blockStyle=""
            alignment={alignmentForTeaserBlock(index, 1)}
          />
        )
      })}
    </NavbarPhraseResultsWrapper>
  )
}

export default SearchPage
