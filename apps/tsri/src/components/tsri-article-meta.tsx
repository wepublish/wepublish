import styled from '@emotion/styled';
import { Badge, css } from '@mui/material';
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
    border: 2px solid #fff;
    background: black;
    color: white;
    right: unset;
    left: -24px;
    aspect-ratio: 1;
    color: white;
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
    border-color: black;
    color: black;
    height: 2rem;
    overflow: hidden;

    &:hover {
      border-color: #f5ff64;

      & > *:first-of-type {
        z-index: 5;
        background-color: #f5ff64;
        color: black;
      }
    }
  }
`;

const commentsLinkStyles = css`
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
    background-color: #f5ff64;
    color: black;
    border-color: #f5ff64;
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
