import styled from '@emotion/styled';
import { css, NoSsr } from '@mui/material';
import { ArticleDate, ArticleDateWrapper } from '@wepublish/article/website';
import {
  BuilderArticleDateProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdShare } from 'react-icons/md';

const iconButtonStyles = css`
  padding: 0;
`;

const MannschaftArticleDateWithShareWrapper = styled(ArticleDateWrapper)`
  display: grid;
  grid-auto-flow: column;
  justify-content: space-between;
  align-items: start;
`;

const ArticleDateStyled = styled(ArticleDate)`
  margin: 0;
`;

export const MannschaftArticleDateWithShare = ({
  article,
}: BuilderArticleDateProps) => {
  const {
    elements: { IconButton },
  } = useWebsiteBuilder();

  const showDate = !!article?.publishedAt;
  const showShare = !!article;
  const canShare = typeof window !== 'undefined' && 'share' in navigator;

  if (!showDate && !showShare) {
    return;
  }

  return (
    <MannschaftArticleDateWithShareWrapper as={'div'}>
      {showDate && <ArticleDateStyled article={article} />}

      {showShare && (
        <NoSsr>
          {canShare && (
            <IconButton
              aria-label="Share"
              color="primary"
              onClick={async () => {
                await navigator.share({
                  url: article.url,
                  title: article.latest.title ?? undefined,
                  text: article.latest.lead ?? undefined,
                });
              }}
              css={iconButtonStyles}
            >
              <MdShare size={24} />
            </IconButton>
          )}
        </NoSsr>
      )}
    </MannschaftArticleDateWithShareWrapper>
  );
};
