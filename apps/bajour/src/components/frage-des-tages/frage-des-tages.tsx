import styled from '@emotion/styled';
import { css } from '@mui/material';
import { isPollBlock } from '@wepublish/block-content/website';
import { Comment } from '@wepublish/comments/website';
import { Image } from '@wepublish/image/website';
import { Button } from '@wepublish/ui';
import {
  ArticleTeaser,
  CommentSort,
  FullCommentFragment,
  SortOrder,
  useCommentListQuery,
} from '@wepublish/website/api';
import {
  BuilderCommentProps,
  BuilderTeaserListBlockProps,
  BuilderTeaserSlotsBlockProps,
} from '@wepublish/website/builder';
import Link from 'next/link';
import { useMemo } from 'react';
import { MdForum } from 'react-icons/md';

import { PollBlock } from '../website-builder-overwrites/blocks/poll-block/poll-block';
import { AuthorBox } from './author-box';
import { InfoBox } from './info-box';

interface CommentWithChildren extends FullCommentFragment {
  children: CommentWithChildren[];
}

const countComments = (comments: CommentWithChildren[] | []): number => {
  let total = comments.length;

  for (const comment of comments) {
    if (comment.children) {
      total += countComments(comment.children);
    }
  }

  return total;
};

export const FrageDesTagesContainer = styled('div')`
  grid-column: -1/1;
  padding: ${({ theme }) => `${theme.spacing(1.5)}`};

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      padding: 0;
    }
  `}
`;

export const FrageDesTagesWrapper = styled('div')`
  display: grid;
  column-gap: 0;
  row-gap: ${({ theme }) => theme.spacing(3)};
  grid-template-columns: 1fr;
  align-items: stretch;
  border-radius: ${({ theme }) => theme.spacing(4)};
  background-color: ${({ theme }) => theme.palette.secondary.light};
  padding: ${({ theme }) => `${theme.spacing(2)}`};

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      padding: ${theme.spacing(4)} ${theme.spacing(5)};
      grid-template-columns: repeat(12, 1fr);
      column-gap: ${theme.spacing(2)};
    }
  `}
`;

export const PollWrapper = styled('div')`
  grid-column: 1/13;

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      grid-column: 1/5;
    }
  `}
`;

export const CommentsWrapper = styled('div')`
  display: flex;
  flex-flow: column;
  gap: ${({ theme }) => theme.spacing(1)};
  grid-column: 1/13;

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      grid-column: 6/13;
    }
  `}
`;

export const AuthorAndContext = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      gap: ${theme.spacing(4)};
      grid-template-columns: repeat(2, 1fr);
    }
  `}
`;

export const Comments = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: ${({ theme }) => theme.spacing(4)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(2, 1fr);
    }
  `}
`;

export const TopComments = styled('div')`
  font-size: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  padding-left: ${({ theme }) => `${theme.spacing(1)}`};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

export const StyledComment = styled(Comment)`
  background-color: ${({ theme }) => theme.palette.common.white};
  padding: ${({ theme }) => theme.spacing(1.5)};
  border-radius: 20px;

  span {
    font-weight: 300;
  }
`;

export const FdtArticleImage = styled(Image)`
  grid-column-start: 5;
  grid-column-end: 9;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.spacing(2.5)};
`;

export const ReadMoreLink = styled(Link)`
  grid-column: -1/1;
  justify-self: self-end;
`;

const ReadMoreButton = styled(Button)`
  text-transform: uppercase;
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(2.5)}`};
`;

export const FrageDesTages = ({
  teasers,
  className,
}: BuilderTeaserListBlockProps | BuilderTeaserSlotsBlockProps) => {
  const article = (teasers[0] as ArticleTeaser | undefined)?.article;

  const { data: commentsData } = useCommentListQuery({
    variables: {
      itemId: article?.id || '',
      sort: CommentSort.Rating,
      order: SortOrder.Descending,
    },
  });

  const pollToPass = article?.latest.blocks.find(isPollBlock)?.poll;

  const numberOfComments = useMemo(() => {
    return countComments(
      (commentsData?.commentsForItem as CommentWithChildren[]) || []
    );
  }, [commentsData?.commentsForItem]);

  return (
    <FrageDesTagesContainer>
      <FrageDesTagesWrapper className={className}>
        <PollWrapper>
          {article?.latest.image && (
            <FdtArticleImage image={article.latest.image} />
          )}
          <PollBlock poll={pollToPass} />
        </PollWrapper>

        <CommentsWrapper>
          <AuthorAndContext>
            <div>
              {article?.latest.authors[0] ?
                <AuthorBox author={article?.latest.authors[0]} />
              : null}
            </div>
            <div>
              <InfoBox richText={pollToPass?.infoText || []} />
            </div>
          </AuthorAndContext>

          <TopComments>Top antworten</TopComments>
          <Comments>
            {commentsData?.commentsForItem
              .slice(0, 2)
              .map(
                ({
                  text,
                  title,
                  user,
                  createdAt,
                  id,
                  authorType,
                  guestUsername,
                }) => {
                  const dataToPass = {
                    text,
                    title,
                    user,
                    createdAt,
                    authorType,
                    guestUsername,
                  } as BuilderCommentProps;

                  return (
                    <StyledComment
                      {...dataToPass}
                      key={id}
                    />
                  );
                }
              )}
          </Comments>
        </CommentsWrapper>

        <ReadMoreLink href={article?.url || ''}>
          <ReadMoreButton
            endIcon={<MdForum />}
            variant="contained"
          >{`Mitreden ${numberOfComments}`}</ReadMoreButton>
        </ReadMoreLink>
      </FrageDesTagesWrapper>
    </FrageDesTagesContainer>
  );
};
