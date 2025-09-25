import styled from '@emotion/styled'
import { ArticleDate, ArticleDateWrapper } from '@wepublish/article/website'
import { CommentListItemShare } from '@wepublish/comments/website'
import { BuilderArticleDateProps } from '@wepublish/website/builder'

const BajourArticleDateWithShareWrapper = styled(ArticleDateWrapper)`
  display: grid;
  grid-auto-flow: column;
  justify-content: space-between;
  align-items: start;
`;

const ArticleDateStyled = styled(ArticleDate)`
  margin: 0;
`;

export const BajourArticleDateWithShare = ({ article }: BuilderArticleDateProps) => {
  const showDate = !!article?.publishedAt
  const showShare = !!article

  if (!showDate && !showShare) {
    return;
  }

  return (
    <BajourArticleDateWithShareWrapper as={'div'}>
      {showDate && <ArticleDateStyled article={article} />}

      <CommentListItemShare url={article.url} title="Share" />
    </BajourArticleDateWithShareWrapper>
  );
};
