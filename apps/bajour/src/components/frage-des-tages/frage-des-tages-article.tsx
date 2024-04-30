import {css, styled} from '@mui/material'
import {ApiV1, PollBlockProvider} from '@wepublish/website'
import Image from 'next/image'

import {CommentListContainer} from '../website-builder-overwrites/blocks/comment-list-container/comment-list-container'
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
      ${theme.breakpoints.up('sm')} {
        grid-column: 1/5;
      }
    `}
`

export const CommentsWrapper = styled('div')`
  grid-column: 1/13;

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('sm')} {
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
`

export const FrageDesTagesArticle = ({
  article,
  className
}: {
  article: ApiV1.Article
  className: string
}) => {
  const pollToPass = (article?.blocks.find(b => b.__typename === 'PollBlock') as ApiV1.PollBlock)
    .poll

  const {data: authorData} = ApiV1.useAuthorQuery({
    variables: {
      id: 'cltwrck6v001fc9eizptqd2l3'
    }
  })

  return (
    <PollBlockProvider>
      <FrageDesTagesWrapper className={className}>
        <FDTLogo src={frageDesTagesLogo} width={110} height={70} alt="frage-des-tages-logo" />
        <PollWrapper>
          <PollBlockStyled poll={pollToPass} />
        </PollWrapper>
        <CommentsWrapper>
          <AuthorAndContext>
            <div>{authorData?.author ? <StyledAuthorBox author={authorData?.author} /> : null}</div>
            <div>
              <StyledInfoBox richText={pollToPass?.infoText || []} />
            </div>
          </AuthorAndContext>
          <TopComments>Top antworten</TopComments>
          <CommentListContainer
            id={article.id}
            variables={{
              sort: ApiV1.CommentSort.Rating,
              order: ApiV1.SortOrder.Descending
            }}
            type={ApiV1.CommentItemType.Article}
          />
        </CommentsWrapper>
      </FrageDesTagesWrapper>
    </PollBlockProvider>
  )
}
