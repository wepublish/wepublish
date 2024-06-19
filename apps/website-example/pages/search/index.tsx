import {css, styled, TextField} from '@mui/material'
import {Button} from '@wepublish/ui'
import {alignmentForTeaserBlock, ApiV1, Teaser} from '@wepublish/website'
import {useRouter} from 'next/router'
import {useEffect, useState} from 'react'
import {MdSearch} from 'react-icons/md'

export const SearchInput = styled(TextField)`
  width: 100%;
`

export const SearchForm = styled('form')`
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
`

export const SearchButton = styled(Button)`
  margin-left: ${({theme}) => theme.spacing(2)};
`

export const NavbarPhraseResultsWrapper = styled('div')`
  padding: ${({theme}) => theme.spacing(2.5)};
  background-color: ${({theme}) => theme.palette.common.white};
  color: ${({theme}) => theme.palette.primary.contrastText};
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transform: translateY(100%);
  overflow-y: scroll;
  max-height: 100vh;
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

const SearchPage: React.FC = () => {
  const router = useRouter()
  const {query} = router
  const [rawQuery, setRawQuery] = useState((query.q as string) || '')
  const [phraseQuery, setPhraseQuery] = useState((query.q as string) || '')
  const {
    data: phraseData,
    loading,
    error
  } = ApiV1.usePhraseQuery({
    variables: {
      query: phraseQuery
    }
  })

  useEffect(() => {
    if (query.q) {
      setPhraseQuery(query.q as string)
    }
  }, [query.q])

  const handleSearch = () => {
    router.push({
      pathname: '/search',
      query: {q: rawQuery}
    })
    setPhraseQuery(rawQuery)
  }

  console.log('phraseQuery', phraseQuery)
  console.log('phraseData', phraseData)
  const articlesNodes =
    (phraseData?.phrase && phraseData.phrase.articles && phraseData.phrase.articles.nodes) || []
  const pagesNodes =
    (phraseData?.phrase && phraseData.phrase.pages && phraseData.phrase.pages.nodes) || []

  const modifiedArticlesNodes = articlesNodes.map(node => ({
    __typename: 'ArticleTeaser',
    article: node
  }))

  const modifiedPagesNodes = pagesNodes.map(node => ({
    __typename: 'PageTeaser',
    page: node
  }))

  const phraseResultTeasers = [...modifiedArticlesNodes, ...modifiedPagesNodes]

  console.log('phraseResultTeasers', phraseResultTeasers)

  return (
    <div>
      <SearchForm onSubmit={handleSearch}>
        <SearchInput
          type="text"
          label="Type to search"
          onChange={e => setRawQuery(e.target.value)}
        />
        <SearchButton onClick={handleSearch} ariaLabel={'Search'}>
          <MdSearch />
        </SearchButton>
      </SearchForm>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {/* {phraseData && (
        <ul>
          {phraseData.results.map((result: string, index: number) => (
            <li key={index}>{result}</li>
          ))}
        </ul>
      )} */}
      {phraseResultTeasers && <NavbarPhraseResults teasers={phraseResultTeasers} />}
    </div>
  )
}

export const NavbarPhraseResults = ({
  teasers
}: // onClose
{
  teasers: ApiV1.ArticleTeaser[] | ApiV1.PageTeaser[]
  // onClose: () => void
}) => {
  // const {
  //   elements: {IconButton}
  // } = useWebsiteBuilder()

  return (
    <NavbarPhraseResultsWrapper>
      {/* <IconButton css={{fontSize: '2em', color: 'black'}} onClick={onClose}>
        <MdClose />
      </IconButton> */}
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
