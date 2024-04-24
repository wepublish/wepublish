import {css, styled} from '@mui/material'
import {
  ApiV1,
  AuthorChip,
  BuilderCommentProps,
  BuilderTeaserListBlockProps,
  Comment,
  RichTextBlock
} from '@wepublish/website'
import Image from 'next/image'

import {PollBlock} from '../../website-builder-overwrites/blocks/poll-block/poll-block'
import frageDesTagesLogo from './frage-des-tages.svg'
import {InfoBox} from './info-box'

export const FrageDesTagesWrapper = styled('div')`
  display: grid;
  column-gap: ${({theme}) => theme.spacing(2)};
  row-gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: 1fr;
  align-items: stretch;
  border-radius: ${({theme}) => theme.spacing(4)};
  background-color: ${({theme}) => theme.palette.secondary.main};
  padding: ${({theme}) => `${theme.spacing(4)} ${theme.spacing(5)}`};

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('sm')} {
        grid-template-columns: repeat(12, 1fr);
      }

      /* ${theme.breakpoints.up('md')} {
        grid-template-columns: repeat(12, 1fr);
      } */
    `}
`

export const PollWrapper = styled('div')`
  /* width: min-content; */
  grid-column: 1/5;
`

export const CommentsWrapper = styled('div')`
  /* width: min-content; */
  grid-column: 6/13;
`

export const FirstComment = styled(Comment)`
  color: #ff0d63;
`

export const AuthorAndContext = styled('div')`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({theme}) => theme.spacing(6)};
`

export const Comments = styled('div')`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({theme}) => theme.spacing(6)};
`

export const StyledAuthorChip = styled(AuthorChip)`
  background-color: ${({theme}) => theme.palette.common.white};
  padding: ${({theme}) => theme.spacing(1.5)};
  border-radius: ${({theme}) => theme.spacing(2.5)};
`

export const StyledRichTextBlock = styled(RichTextBlock)`
  background-color: ${({theme}) => theme.palette.common.white};
  padding: ${({theme}) => theme.spacing(1.5)};
  border-radius: ${({theme}) => theme.spacing(2.5)};
`

export const TopComments = styled('div')`
  font-size: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  margin: ${({theme}) => `${theme.spacing(2)} 0 ${theme.spacing(1)} 0`};
`

export const StyledComment = styled(Comment)`
  background-color: ${({theme}) => theme.palette.common.white};
  padding: ${({theme}) => theme.spacing(1.5)};
  border-radius: ${({theme}) => theme.spacing(2.5)};
`

export const FDTLogo = styled(Image)`
  grid-column: 12 / 13;
`

export const FrageDesTages = ({teasers, className, ...rest}: BuilderTeaserListBlockProps) => {
  // const {
  //   blocks: {Comment}
  // } = useWebsiteBuilder()

  console.log('teasers', teasers)

  const {
    data: commentsData,
    loading: commentsLoading,
    error: commentsError
  } = ApiV1.useCommentListQuery({
    variables: {
      itemId: teasers[0].article.id,
      sort: ApiV1.CommentSort.Rating,
      order: ApiV1.SortOrder.Descending
    }
  })

  const pollToPass = teasers[0].article.blocks.find(b => b.__typename === 'PollBlock').poll

  const {
    data: authorData,
    loading: authorLoading,
    error: authorError
  } = ApiV1.useAuthorQuery({
    variables: {
      id: 'cltwrck6v001fc9eizptqd2l3'
    }
  })
  console.log('commentsData?.comments[0]', commentsData?.comments[0])

  return (
    <FrageDesTagesWrapper className={className}>
      <FDTLogo src={frageDesTagesLogo} width={110} height={70} alt="frage-des-tages-logo" />
      <PollWrapper>
        <PollBlock poll={pollToPass} />
      </PollWrapper>
      <CommentsWrapper>
        <AuthorAndContext>
          {authorData?.author ? <StyledAuthorChip author={authorData?.author} /> : null}
          <div>
            <InfoBox richText={pollToPass.infoText} />
          </div>
        </AuthorAndContext>
        <TopComments>Top antworten</TopComments>
        <Comments>
          {commentsData?.comments.slice(0, 2).map(comment => {
            const commentDataToPass = {
              text: comment.text,
              title: comment.title,
              user: comment.user,
              createdAt: comment.createdAt
            } as BuilderCommentProps

            return <StyledComment {...commentDataToPass} key={comment.id} />
          })}
        </Comments>
      </CommentsWrapper>
    </FrageDesTagesWrapper>
  )
}
