import {css, styled} from '@mui/material'
import {ApiV1, PollBlockProvider, useAsyncAction} from '@wepublish/website'
import Image from 'next/image'
import {useRouter} from 'next/router'
import {useCallback, useEffect, useState} from 'react'

import {CommentListContainer} from '../website-builder-overwrites/blocks/comment-list-container/comment-list-container-fdt'
import {PollBlock} from '../website-builder-overwrites/blocks/poll-block/poll-block'
import {AuthorBox} from './author-box'
import frageDesTagesLogo from './frage-des-tages.svg'
import {InfoBox} from './info-box'
import {TopComments} from './frage-des-tages'

export const FrageDesTagesContainer = styled('div')`
  padding: ${({theme}) => `${theme.spacing(1.5)}`};

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('md')} {
        padding: 0;
        grid-column: 1 / 13;
      }
    `}
`

export const FrageDesTagesWrapper = styled('div')`
  display: grid;
  column-gap: ${({theme}) => theme.spacing(2)};
  row-gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: 1fr;
  align-items: stretch;
  border-radius: ${({theme}) => theme.spacing(4)};
  padding: ${({theme}) => `${theme.spacing(1)}`};

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('sm')} {
        padding: ${theme.spacing(4)} ${theme.spacing(5)};
        grid-template-columns: repeat(12, 1fr);
      }
    `}
`

export const PollWrapper = styled('div')`
  grid-column: 1/13;

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('md')} {
        grid-column: 1/5;
      }
    `}
`

export const CommentsWrapper = styled('div')`
  grid-column: 1/13;

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('md')} {
        grid-column: 6/13;
      }
    `}
`

export const AuthorAndContext = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({theme}) => theme.spacing(2)};

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('sm')} {
        gap: ${theme.spacing(6)};
        grid-template-columns: repeat(2, 1fr);
      }
    `}
`

export const FDTLogo = styled(Image)`
  grid-column: 10 / 13;

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('sm')} {
        grid-column: 1 / 2;
      }
    `}
`

const StyledAuthorBox = styled(AuthorBox)`
  background-color: ${({theme}) => theme.palette.secondary.light};
`

const StyledInfoBox = styled(InfoBox)`
  background-color: ${({theme}) => theme.palette.secondary.light};
`

const PollBlockStyled = styled(PollBlock)`
  position: sticky;
  top: ${({theme}) => theme.spacing(14)};

  button {
    text-transform: uppercase;
    border-width: 1px;
    text-align: left;
    font-size: 16px;
    justify-content: flex-start;
    padding: ${({theme}) => `${theme.spacing(1)} ${theme.spacing(1.5)}`};

    &:hover {
      border-width: 1px;
      background-color: ${({theme}) => theme.palette.primary.main};
      color: ${({theme}) => theme.palette.common.white};
    }
  }
`

export const FdtPollBlock = ({poll}: {poll?: ApiV1.PollBlock['poll']}) => {
  const [vote] = ApiV1.usePollVoteMutation()
  const router = useRouter()
  const {
    query: {slug}
  } = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const callAction = useAsyncAction(setLoading, setError)

  const {data: articleData} = ApiV1.useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string
    }
  })

  const author = articleData?.article?.authors[0]

  const autoVote = useCallback(async () => {
    const answerId = router.query.answerId as string
    if (answerId) {
      callAction(async () => {
        await vote({
          variables: {
            answerId
          }
        })
      })()
    }
  }, [router.query])

  useEffect(() => {
    autoVote()
  }, [autoVote])

  return (
    <PollBlockProvider>
      <FrageDesTagesContainer>
        <FrageDesTagesWrapper>
          <FDTLogo src={frageDesTagesLogo} width={110} height={70} alt="frage-des-tages-logo" />
          <PollWrapper>
            <PollBlockStyled poll={poll} />
          </PollWrapper>
          <CommentsWrapper>
            <AuthorAndContext>
              <div>{author ? <StyledAuthorBox author={author} /> : null}</div>
              <div>
                <StyledInfoBox richText={poll?.infoText || []} />
              </div>
            </AuthorAndContext>
            <TopComments>Top antworten</TopComments>
            <CommentListContainer
              id={articleData?.article?.id || ''}
              variables={{
                sort: ApiV1.CommentSort.Rating,
                order: ApiV1.SortOrder.Descending
              }}
              type={ApiV1.CommentItemType.Article}
            />
          </CommentsWrapper>
        </FrageDesTagesWrapper>
      </FrageDesTagesContainer>
    </PollBlockProvider>
  )
}
