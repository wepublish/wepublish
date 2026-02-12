import styled from '@emotion/styled';
import { Badge, css, Theme } from '@mui/material';
import {
  ArticleTags as ArticleTagsDefault,
  ArticleTagsWrapper,
} from '@wepublish/article/website';
import { useCommentListQuery } from '@wepublish/website/api';
import {
  BuilderArticleMetaProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { FaCommentSlash } from 'react-icons/fa6';
import { FiMessageCircle as FiMessageCircleDefault } from 'react-icons/fi';

export const ArticleMetaWrapper = styled('div')`
  grid-column: 1 / 3;
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-start;
  position: relative;
  gap: 4px;
  padding-top: 5cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    top: -100%;
    grid-column: 2 / 3;
    gap: 8px;
    padding-top: 0;
  }

  ${ArticleTagsWrapper} {
    gap: 4px;

    ${({ theme }) => theme.breakpoints.up('md')} {
      gap: 8px;
    }
  }
`;

export const ArticleMetaComments = styled('div')``;

const ArticleMetaBadge = styled(Badge)`
  & .MuiBadge-badge {
    top: 22px;
    border: 1px solid ${({ theme }) => theme.palette.common.white};
    background: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
    right: unset;
    left: -22px;
    aspect-ratio: 1;
    color: ${({ theme }) => theme.palette.common.white};
    scale: 0.8;

    ${({ theme }) => theme.breakpoints.up('md')} {
      border-width: 2px;
      top: 27px;
      left: -24px;
      scale: 1;
    }
  }
`;

const FiMessageCircle = styled(FiMessageCircleDefault)`
  transform: scale(-1, 1);
  scale: 0.6;

  ${({ theme }) => theme.breakpoints.up('md')} {
    scale: 1;
  }
`;

const ArticleTags = styled(ArticleTagsDefault)`
  & > .MuiChip-root {
    padding: 0.4rem 0.1rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.black};
    height: 1.3rem;
    overflow: hidden;

    &:hover {
      border-color: ${({ theme }) => theme.palette.primary.light};

      & > *:first-of-type {
        z-index: 5;
        background-color: ${({ theme }) => theme.palette.primary.light};
        color: ${({ theme }) => theme.palette.common.black};
      }
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      padding: 0.9rem 0.25rem;
      font-size: 1.1rem;
      height: 2rem;
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
  width: 1.3rem;
  height: 1.3rem;
  justify-content: center;
  align-items: center;

  &:hover {
    background-color: ${theme.palette.primary.light};
    color: ${theme.palette.common.black};
    border-color: ${theme.palette.primary.light};
  }

  ${theme.breakpoints.up('md')} {
    width: 2rem;
    height: 2rem;
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
