import styled from '@emotion/styled';
import { Chip } from '@mui/material';
import {
  BuilderArticleMetaProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const ArticleTagsWrapper = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const ArticleTags = ({
  article,
  className,
}: BuilderArticleMetaProps) => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();

  if (!article?.tags.length) {
    return null;
  }

  return (
    <ArticleTagsWrapper className={className}>
      {article.tags.map(tag => (
        <Chip
          key={tag.id}
          label={tag.tag}
          component={Link}
          href={tag.url}
          color="primary"
          variant="outlined"
          clickable
        />
      ))}
    </ArticleTagsWrapper>
  );
};
