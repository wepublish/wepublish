import {css, styled} from '@mui/material'
import {ApiV1, PollBlockProvider, usePollBlock} from '@wepublish/website'
import {useRouter} from 'next/router'
import {useCallback, useEffect, useState} from 'react'

import {CommentListContainer} from '../website-builder-overwrites/blocks/comment-list-container/comment-list-container-fdt'
import {PollBlock} from '../website-builder-overwrites/blocks/poll-block/poll-block'
import {AuthorBox} from './author-box'
import {FdtArticleImage, TopComments} from './frage-des-tages'
import {InfoBox} from './info-box'

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
  display: flex;
  flex-flow: column;
  gap: ${({theme}) => theme.spacing(1)};
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
    justify-content: start;
    padding: ${({theme}) => `${theme.spacing(1)} ${theme.spacing(1.5)}`};

    &:hover {
      border-width: 1px;
      background-color: ${({theme}) => theme.palette.primary.main};
      color: ${({theme}) => theme.palette.common.white};
    }
  }
`

export const FdtPollBlock = ({poll}: {poll?: ApiV1.PollBlock['poll']}) => {
  const router = useRouter()
  const {
    query: {slug}
  } = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const {vote} = usePollBlock()

  const {data: articleData} = ApiV1.useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string
    }
  })

  const author = articleData?.article?.authors[0]

  const autoVote = useCallback(async () => {
    const answerId = router.query.answerId as string

    if (!answerId || !poll?.id) {
      return
    }

    await vote(
      {
        variables: {
          answerId
        }
      },
      poll.id
    )
  }, [poll?.id, router.query.answerId, vote])

  useEffect(() => {
    autoVote()
  }, [autoVote])

  return (
    <PollBlockProvider>
      <FrageDesTagesContainer>
        <FrageDesTagesWrapper>
          <PollWrapper>
            {articleData?.article?.image && <FdtArticleImage image={articleData.article.image} />}
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

            {!articleData?.article?.disableComments && (
              <CommentListContainer
                id={articleData?.article?.id || ''}
                variables={{
                  sort: ApiV1.CommentSort.Rating,
                  order: ApiV1.SortOrder.Descending
                }}
                type={ApiV1.CommentItemType.Article}
                maxCommentDepth={1}
              />
            )}
          </CommentsWrapper>
        </FrageDesTagesWrapper>
      </FrageDesTagesContainer>
    </PollBlockProvider>
  )
}
