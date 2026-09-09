import styled from '@emotion/styled';
import { ArticleDate, ArticleDateWrapper } from '@wepublish/article/website';
import { Share } from '@wepublish/ui';
import { BuilderArticleDateProps } from '@wepublish/website/builder';

const BajourArticleDateWithShareWrapper = styled(ArticleDateWrapper)`
  display: grid;
  grid-auto-flow: column;
  justify-content: space-between;
  align-items: start;
`;

const ArticleDateStyled = styled(ArticleDate)`
  margin: 0;
`;

const ShareStyled = styled(Share)`
  button {
    padding: 0;
    color: ${({ theme }) => theme.palette.primary.main};
  }

  svg {
    font-size: 24px;
  }
`;

export const BajourArticleDateWithShare = ({
  article,
}: BuilderArticleDateProps) => {
  if (!article) {
    return;
  }

  return (
    <BajourArticleDateWithShareWrapper as={'div'}>
      {!!article.publishedAt && <ArticleDateStyled article={article} />}

      <ShareStyled
        url={article.url}
        title={article.latest.title ?? undefined}
        text={article.latest.lead ?? undefined}
      />
    </BajourArticleDateWithShareWrapper>
  );
};
