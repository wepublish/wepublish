import styled from '@emotion/styled';
import { css, NoSsr } from '@mui/material';
import { ArticleDate, ArticleDateWrapper } from '@wepublish/article/website';
import { Article } from '@wepublish/website/api';
import {
  BuilderArticleDateProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useState } from 'react';
import { MdShare } from 'react-icons/md';

const iconButtonStyles = css`
  padding: 0;
`;

const BajourArticleDateWithShareWrapper = styled(ArticleDateWrapper)`
  display: grid;
  grid-auto-flow: column;
  justify-content: space-between;
  align-items: start;
`;

const ArticleDateStyled = styled(ArticleDate)`
  margin: 0;
`;

const ShareButtonWrapper = styled('div')`
  position: relative;
  display: inline-block;
`;

const SuccessMessage = styled('div')`
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  padding: 8px 12px;
  border-radius: 4px;
  text-wrap: nowrap;
  background-color: ${({ theme }) => theme.palette.success.main};
  color: ${({ theme }) => theme.palette.success.contrastText};
`;

export const BajourArticleDateWithShare = ({
  article,
}: BuilderArticleDateProps) => {
  const {
    elements: { IconButton },
  } = useWebsiteBuilder();

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const share = async (article: Article) => {
    // Native sharing dialog if supported, otherwise copy to clipboard
    if (typeof window !== 'undefined' && 'share' in navigator) {
      await navigator.share({
        url: article.url,
        title: article.latest.title ?? undefined,
        text: article.latest.lead ?? undefined,
      });
    } else {
      await navigator.clipboard.writeText(article.url);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };

  const showDate = !!article?.publishedAt;
  const showShare = !!article;

  if (!showDate && !showShare) {
    return;
  }

  return (
    <BajourArticleDateWithShareWrapper as={'div'}>
      {showDate && <ArticleDateStyled article={article} />}

      {showShare && (
        <NoSsr>
          <ShareButtonWrapper>
            {showSuccessMessage && (
              <SuccessMessage>
                Link wurde in die Zwischenablage kopiert.
              </SuccessMessage>
            )}
            <IconButton
              aria-label="Share"
              color="primary"
              onClick={() => share(article)}
              css={iconButtonStyles}
            >
              <MdShare size={24} />
            </IconButton>
          </ShareButtonWrapper>
        </NoSsr>
      )}
    </BajourArticleDateWithShareWrapper>
  );
};
