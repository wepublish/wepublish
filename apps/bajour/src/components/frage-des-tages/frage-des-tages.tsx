import {css, styled} from '@mui/material'
import {Button} from '@wepublish/ui'
import {ApiV1, BuilderCommentProps, BuilderTeaserListBlockProps, Comment} from '@wepublish/website'
import Image from 'next/image'
import Link from 'next/link'

import {PollBlock} from '../website-builder-overwrites/blocks/poll-block/poll-block'
import {AuthorBox} from './author-box'
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
    `}
`

export const PollWrapper = styled('div')`
  grid-column: 1/5;
`

export const CommentsWrapper = styled('div')`
  grid-column: 6/13;
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

export const FrageDesTages = ({teasers, className}: BuilderTeaserListBlockProps) => {
  const article = (teasers[0] as ApiV1.ArticleTeaser).article

  const {data: commentsData} = ApiV1.useCommentListQuery({
    variables: {
      itemId: article?.id || '',
      sort: ApiV1.CommentSort.Rating,
      order: ApiV1.SortOrder.Descending
    }
  })

  const pollToPass = (article?.blocks.find(b => b.__typename === 'PollBlock') as ApiV1.PollBlock)
    .poll

  const {data: authorData} = ApiV1.useAuthorQuery({
    variables: {
      id: 'cltwrck6v001fc9eizptqd2l3'
    }
  })

  return (
    <FrageDesTagesWrapper className={className}>
      <FDTLogo src={frageDesTagesLogo} width={110} height={70} alt="frage-des-tages-logo" />
      <PollWrapper>
        <PollBlock poll={pollToPass} />
      </PollWrapper>
      <CommentsWrapper>
        <AuthorAndContext>
          <div>
            {authorData?.author ? <AuthorBox author={authorData?.author} className="" /> : null}
          </div>
          <div>
            <InfoBox richText={pollToPass?.infoText || []} />
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
      <Link href={article?.url || ''}>
        <Button>Go to article</Button>
      </Link>
    </FrageDesTagesWrapper>
  )
}
