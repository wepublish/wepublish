import { IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MdDownload, MdLink } from 'react-icons/md';

import {
  ActionColumn,
  ArticleImage,
  ArticleLead,
  ArticleLink,
  ArticleRow,
  ArticleTitle,
  ButtonTopMargin,
  ChipTopMargin,
  ContentArea,
  ImagePlaceholder,
  MetaLine,
  PublisherName,
} from './networkContent.styles';
import type { PeerArticle, PeerMatch } from './networkContent.types';
import { formatDate } from './networkContent.utils';

interface NetworkContentArticleItemProps {
  article: PeerArticle;
  peerMatch: PeerMatch | null;
  onImport: (peerId: string, articleId: string) => void;
  onShowPeerInfo: () => void;
}

export function NetworkContentArticleItem({
  article,
  peerMatch,
  onImport,
  onShowPeerInfo,
}: NetworkContentArticleItemProps) {
  const { t } = useTranslation();
  const publisher = article.client?.name || '';
  const date = formatDate(article.source_publishedAt);

  return (
    <ArticleRow>
      <ArticleLink
        href={article.source_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {article.source_imageUrl ?
          <ArticleImage
            src={article.source_imageUrl}
            alt=""
            loading="lazy"
          />
        : <ImagePlaceholder />}
      </ArticleLink>

      <ArticleLink
        href={article.source_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ContentArea>
          <ArticleTitle>{article.source_title}</ArticleTitle>
          {article.source_lead && (
            <ArticleLead>{article.source_lead}</ArticleLead>
          )}
          <MetaLine>{date}</MetaLine>
        </ContentArea>
      </ArticleLink>

      <ActionColumn>
        <PublisherName>{publisher}</PublisherName>
        {peerMatch ?
          <Tooltip
            title={t('networkContentDashboard.importFrom', {
              peer: peerMatch.peerName,
            })}
          >
            <ButtonTopMargin
              size="small"
              variant="contained"
              startIcon={<MdDownload />}
              onClick={() => onImport(peerMatch.peerId, article.source_id)}
            >
              {t('peerArticles.import.import')}
            </ButtonTopMargin>
          </Tooltip>
        : <Tooltip title={t('networkContentDashboard.noPeer')}>
            <ChipTopMargin
              icon={<MdLink />}
              label={t('networkContentPage.connectBtn')}
              size="small"
              color="primary"
              variant="outlined"
              onClick={onShowPeerInfo}
              clickable
            />
          </Tooltip>
        }
      </ActionColumn>
    </ArticleRow>
  );
}
