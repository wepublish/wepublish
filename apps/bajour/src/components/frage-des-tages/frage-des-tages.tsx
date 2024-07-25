import {css, styled} from '@mui/material'
import {Button} from '@wepublish/ui'
import {
  ApiV1,
  BuilderCommentProps,
  BuilderTeaserListBlockProps,
  Comment,
  isPollBlock
} from '@wepublish/website'
import Image from 'next/image'
import Link from 'next/link'
import {useMemo} from 'react'
import {MdForum} from 'react-icons/md'

import {PollBlock} from '../website-builder-overwrites/blocks/poll-block/poll-block'
import {AuthorBox} from './author-box'
import frageDesTagesLogo from './frage-des-tages.svg'
import {InfoBox} from './info-box'

interface CommentWithChildren extends ApiV1.Comment {
  children: CommentWithChildren[]
}

const countComments = (comments: CommentWithChildren[] | []): number => {
  let total = comments.length

  for (const comment of comments) {
    if (comment.children) {
      total += countComments(comment.children)
    }
  }

  return total
}

export const FrageDesTagesContainer = styled('div')`
  padding: ${({theme}) => `${theme.spacing(1.5)}`};

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('sm')} {
        padding: 0;
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
  background-color: ${({theme}) => theme.palette.secondary.light};
  padding: ${({theme}) => `${theme.spacing(2)}`};

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
        gap: ${theme.spacing(4)};
        grid-template-columns: repeat(2, 1fr);
      }
    `}
`

export const Comments = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({theme}) => theme.spacing(4)};

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('sm')} {
        grid-template-columns: repeat(2, 1fr);
      }
    `}
`

export const TopComments = styled('div')`
  font-size: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  margin: ${({theme}) => `${theme.spacing(2)} 0 ${theme.spacing(1)} 0`};
  padding-left: ${({theme}) => `${theme.spacing(1)}`};
`

export const StyledComment = styled(Comment)`
  background-color: ${({theme}) => theme.palette.common.white};
  padding: ${({theme}) => theme.spacing(1.5)};
  border-radius: ${({theme}) => theme.spacing(2.5)};

  span {
    font-weight: 300;
  }
`

export const FDTLogo = styled(Image)`
  grid-column: 12 / 13;
`

export const ReadMoreLink = styled(Link)`
  grid-column: 11/13;
  justify-self: self-end;
`

const ReadMoreButton = styled(Button)`
  text-transform: uppercase;
  padding: ${({theme}) => `${theme.spacing(1)} ${theme.spacing(2.5)}`};
`

export const FrageDesTages = ({teasers, className}: BuilderTeaserListBlockProps) => {
  const article = (teasers[0] as ApiV1.ArticleTeaser | undefined)?.article

  const {data: commentsData} = ApiV1.useCommentListQuery({
    variables: {
      itemId: article?.id || '',
      sort: ApiV1.CommentSort.Rating,
      order: ApiV1.SortOrder.Descending
    }
  })

  const pollToPass = article?.blocks.find(isPollBlock)?.poll

  const numberOfComments = useMemo(() => {
    return countComments((commentsData?.comments as CommentWithChildren[]) || [])
  }, [commentsData?.comments])

  return (
    <FrageDesTagesContainer>
      <FrageDesTagesWrapper className={className}>
        <FDTLogo src={frageDesTagesLogo} width={110} height={70} alt="frage-des-tages-logo" />
        <PollWrapper>
          <PollBlock poll={pollToPass} />
        </PollWrapper>
        <CommentsWrapper>
          <AuthorAndContext>
            <div>{article?.authors[0] ? <AuthorBox author={article?.authors[0]} /> : null}</div>
            <div>
              <InfoBox richText={pollToPass?.infoText || []} />
            </div>
          </AuthorAndContext>
          <TopComments>Top antworten</TopComments>
          <Comments>
            {commentsData?.comments
              .slice(0, 2)
              .map(({text, title, user, createdAt, id, authorType}) => {
                const dataToPass = {
                  text,
                  title,
                  user,
                  createdAt,
                  authorType
                } as BuilderCommentProps

                return <StyledComment {...dataToPass} key={id} />
              })}
          </Comments>
        </CommentsWrapper>
        <ReadMoreLink href={article?.url || ''}>
          <ReadMoreButton
            endIcon={<MdForum />}
            variant="contained">{`Mitreden ${numberOfComments}`}</ReadMoreButton>
        </ReadMoreLink>
      </FrageDesTagesWrapper>
    </FrageDesTagesContainer>
  )
}
