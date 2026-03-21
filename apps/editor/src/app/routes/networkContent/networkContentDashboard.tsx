import { CircularProgress, Typography } from '@mui/material';
import { useImportPeerArticleMutation } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type { ArticleToImport, ImportOptions } from './networkContent.types';
import { usePeerArticles, usePeerMatching } from './networkContent.hooks';
import {
  CenteredContainer,
  FeedList,
  ScrollContainer,
} from './networkContent.styles';
import { NetworkContentArticleItem } from './networkContentArticleItem';
import { NetworkContentImportDialog } from './networkContentImportDialog';
import { NetworkContentPeerInfoDialog } from './networkContentPeerInfoDialog';

const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  importAuthors: true,
  importTags: true,
  importContentImages: true,
};

export default function NetworkContentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { articles, loading: articlesLoading, error } = usePeerArticles();
  const { findPeerMatch, loading: peersLoading } = usePeerMatching();

  const [articleToImport, setArticleToImport] = useState<ArticleToImport>();
  const [importOptions, setImportOptions] = useState<ImportOptions>(
    DEFAULT_IMPORT_OPTIONS
  );
  const [peerInfoOpen, setPeerInfoOpen] = useState(false);

  const [importPeerArticle, { loading: importing }] =
    useImportPeerArticleMutation({
      onCompleted(data) {
        setArticleToImport(undefined);
        navigate(`/articles/edit/${data.importPeerArticle.id}`);
      },
    });

  const handleConfirmImport = () => {
    if (!articleToImport) return;

    importPeerArticle({
      variables: {
        peerId: articleToImport.peerId,
        articleId: articleToImport.articleId,
        options: importOptions,
      },
    });
  };

  const loading = articlesLoading || peersLoading;

  if (loading) {
    return (
      <CenteredContainer>
        <CircularProgress size={24} />
      </CenteredContainer>
    );
  }

  if (error) {
    return (
      <CenteredContainer>
        <Typography
          color="error"
          variant="body2"
        >
          {t('networkContentDashboard.errorLoading')}
        </Typography>
      </CenteredContainer>
    );
  }

  if (articles.length === 0) {
    return (
      <CenteredContainer>
        <Typography
          color="textSecondary"
          variant="body2"
        >
          {t('networkContentDashboard.noArticles')}
        </Typography>
      </CenteredContainer>
    );
  }

  return (
    <>
      <ScrollContainer>
        <FeedList>
          {articles.map(article => (
            <NetworkContentArticleItem
              key={article.id}
              article={article}
              peerMatch={findPeerMatch(article.client?.apiUrl)}
              onImport={(peerId, articleId) =>
                setArticleToImport({ peerId, articleId })
              }
              onShowPeerInfo={() => setPeerInfoOpen(true)}
            />
          ))}
        </FeedList>
      </ScrollContainer>

      <NetworkContentImportDialog
        articleToImport={articleToImport}
        importOptions={importOptions}
        importing={importing}
        onOptionsChange={setImportOptions}
        onConfirm={handleConfirmImport}
        onClose={() => setArticleToImport(undefined)}
      />

      <NetworkContentPeerInfoDialog
        open={peerInfoOpen}
        onClose={() => setPeerInfoOpen(false)}
      />
    </>
  );
}
