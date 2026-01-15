import styled from '@emotion/styled';
import { Badge, css, Theme } from '@mui/material';
import { ArticleTags as ArticleTagsDefault } from '@wepublish/article/website';
import { useCommentListQuery } from '@wepublish/website/api';
import {
  BuilderArticleMetaProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { FaCommentSlash } from 'react-icons/fa6';
import { FiMessageCircle as FiMessageCircleDefault } from 'react-icons/fi';

export const ArticleMetaWrapper = styled('div')`
  grid-column: 2 / 4;
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-start;
  position: relative;
  top: -100%;
  gap: 8px;
`;

export const ArticleMetaComments = styled('div')``;

const ArticleMetaBadge = styled(Badge)`
  .MuiBadge-badge {
    top: 27px;
    border: 2px solid ${({ theme }) => theme.palette.common.white};
    background: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
    right: unset;
    left: -24px;
    aspect-ratio: 1;
    color: ${({ theme }) => theme.palette.common.white};
  }
`;

const FiMessageCircle = styled(FiMessageCircleDefault)`
  transform: scale(-1, 1);
`;

const ArticleTags = styled(ArticleTagsDefault)`
  & > .MuiChip-root {
    adding: 0.9rem 0.25rem;
    font-size: 1.1rem;
    font-weight: 500;
    border-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.black};
    height: 2rem;
    overflow: hidden;

    &:hover {
      border-color: ${({ theme }) => theme.palette.primary.light};

      & > *:first-of-type {
        z-index: 5;
        background-color: ${({ theme }) => theme.palette.primary.light};
        color: ${({ theme }) => theme.palette.common.black};
      }
    }
  }
`;

const commentsLinkStyles = (theme: Theme) => css`
  margin: 0;
  font: inherit;
  text-decoration: none;
  color: inherit;
  border: 1px solid;
  border-color: currentcolor;
  border-radius: 50%;
  display: flex;
  aspect-ratio: 1/1;
  box-sizing: content-box;
  width: 2rem;
  justify-content: center;
  align-items: center;

  &:hover {
    background-color: ${theme.palette.primary.light};
    color: ${theme.palette.common.black};
    border-color: ${theme.palette.primary.light};
  }
`;

export const TsriArticleMeta = ({
  article,
  className,
}: BuilderArticleMetaProps) => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();
  const { data } = useCommentListQuery({
    fetchPolicy: 'cache-only',
    variables: {
      itemId: article.id,
    },
  });

  const commentCount = data?.comments.length;

  return (
    <ArticleMetaWrapper className={className}>
      <ArticleTags article={article} />

      <ArticleMetaComments>
        <Link
          href="#comments"
          color="inherit"
          css={commentsLinkStyles}
          aria-label="Kommentare"
          title="Kommentare"
        >
          <ArticleMetaBadge
            max={99}
            showZero={true}
            badgeContent={commentCount}
            invisible={!!article.disableComments}
          >
            {article.disableComments ?
              <FaCommentSlash size={24} />
            : <FiMessageCircle size={24} />}
          </ArticleMetaBadge>
        </Link>
      </ArticleMetaComments>
    </ArticleMetaWrapper>
  );
};
