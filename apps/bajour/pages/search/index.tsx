import {css, Pagination, styled, TextField} from '@mui/material'
import {Button} from '@wepublish/ui'
import {alignmentForTeaserBlock, ApiV1, Teaser} from '@wepublish/website'
import {useRouter} from 'next/router'
import {useEffect, useState} from 'react'
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

const ITEMS_PER_PAGE = 5

const SearchPage: React.FC = () => {
  const router = useRouter()
  const {query} = router
  const [rawQuery, setRawQuery] = useState((query.q as string) || '')
  const [phraseQuery, setPhraseQuery] = useState((query.q as string) || '')
  const [page, setPage] = useState(1)

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
      setPhraseQuery(query.q as string)
    }
  }, [query.q])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push({
      pathname: '/search',
      query: {q: rawQuery}
    })
    setPhraseQuery(rawQuery)
    setPage(1)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const articlesNodes =
    (phraseData?.phrase && phraseData.phrase.articles && phraseData.phrase.articles.nodes) || []
  const pagesNodes =
    (phraseData?.phrase && phraseData.phrase.pages && phraseData.phrase.pages.nodes) || []

  const totalArticlesCount = phraseData?.phrase?.articles?.totalCount || 0
  const totalPagesCount = phraseData?.phrase?.pages?.totalCount || 0
  const totalCount = totalArticlesCount + totalPagesCount

  const modifiedArticlesNodes = articlesNodes.map(node => ({
    __typename: 'ArticleTeaser',
    article: node
  }))

  const modifiedPagesNodes = pagesNodes.map(node => ({
    __typename: 'PageTeaser',
    page: node
  }))

  const phraseResultTeasers = [...modifiedArticlesNodes, ...modifiedPagesNodes]

  return (
    <SearchPageWrapper>
      <SearchForm onSubmit={handleSearch}>
        <SearchInput type="text" label="Artikelsuche" onChange={e => setRawQuery(e.target.value)} />
        <SearchButton onClick={handleSearch} aria-label="Artikelsuche">
          <MdSearch size={28} />
        </SearchButton>
      </SearchForm>

      {loading && <SearchStatus>Loading...</SearchStatus>}
      {error && <SearchStatus>Error: {error.message}</SearchStatus>}
      {phraseResultTeasers.length > 0 && (
        <>
          <NavbarPhraseResults teasers={phraseResultTeasers} />
          {totalCount > ITEMS_PER_PAGE && (
            <Pagination
              count={Math.ceil(totalCount / ITEMS_PER_PAGE)}
              page={page}
              onChange={handlePageChange}
              style={{marginTop: '20px'}}
            />
          )}
        </>
      )}
    </SearchPageWrapper>
  )
}

export const NavbarPhraseResults = ({teasers}: {teasers: any[]}) => {
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
