import styled from '@emotion/styled';
import { Badge } from '@mui/material';
import { ArticleTags } from '@wepublish/article/website';
import { useCommentListQuery } from '@wepublish/website/api';
import {
  BuilderArticleMetaProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { FaCommentSlash, FaRegComment } from 'react-icons/fa6';

export const ArticleMetaWrapper = styled('div')`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const ArticleMetaComments = styled('div')`
  margin-right: ${({ theme }) => theme.spacing(2)};
`;

const ArticleMetaBadge = styled(Badge)`
  .MuiBadge-badge {
    right: -3px;
    top: 11px;
    border: 2px solid ${({ theme }) => theme.palette.background.paper};
    background: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.primary.contrastText};
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
        >
          <ArticleMetaBadge
            max={99}
            showZero
            badgeContent={commentCount}
            invisible={!!article.disableComments}
          >
            {article.disableComments ?
              <FaCommentSlash size={24} />
            : <FaRegComment size={24} />}
          </ArticleMetaBadge>
        </Link>
      </ArticleMetaComments>
    </ArticleMetaWrapper>
  );
};
