import { CircularProgress, Typography } from '@mui/material';
import { useImportPeerArticleMutation } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ListViewContainer, ListViewHeader } from '@wepublish/ui/editor';

import type {
  ArticleFilterParams,
  ArticleToImport,
  ImportOptions,
} from './networkContent.types';
import {
  useNetworkClients,
  usePeerArticles,
  usePeerMatching,
} from './networkContent.hooks';
import {
  CenteredContainer,
  FeedList,
  PageGrid,
  PanelColumn,
  SectionTitle,
} from './networkContent.styles';
import { NetworkContentArticleFilters } from './networkContentArticleFilters';
import { NetworkContentArticleItem } from './networkContentArticleItem';
import { NetworkContentImportDialog } from './networkContentImportDialog';
import { NetworkContentPeerInfoDialog } from './networkContentPeerInfoDialog';
import { NetworkMediaList } from './networkContentMediaList';

const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  importAuthors: true,
  importTags: true,
  importContentImages: true,
};

const DEFAULT_FILTERS: ArticleFilterParams = {
  search: '',
  clientName: '',
  dateFrom: '',
  dateTo: '',
};

export function NetworkContentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<ArticleFilterParams>(DEFAULT_FILTERS);
  const {
    articles,
    loading: articlesLoading,
    error,
  } = usePeerArticles(filters);
  const { findPeerMatch, loading: peersLoading } = usePeerMatching();
  const { clients } = useNetworkClients();

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

  const handleSelectClientFromMedia = (clientName: string) => {
    setFilters(prev => ({ ...prev, clientName }));
  };

  const loading = articlesLoading || peersLoading;

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('networkContentPage.title')}</h2>
        </ListViewHeader>
      </ListViewContainer>

      <PageGrid>
        <PanelColumn>
          <SectionTitle>{t('networkContentPage.articlesTitle')}</SectionTitle>

          <NetworkContentArticleFilters
            filters={filters}
            clients={clients}
            onFiltersChange={setFilters}
          />

          {loading && (
            <CenteredContainer>
              <CircularProgress size={24} />
            </CenteredContainer>
          )}

          {!loading && error && (
            <CenteredContainer>
              <Typography
                color="error"
                variant="body2"
              >
                {t('networkContentDashboard.errorLoading')}
              </Typography>
            </CenteredContainer>
          )}

          {!loading && !error && articles.length === 0 && (
            <CenteredContainer>
              <Typography
                color="textSecondary"
                variant="body2"
              >
                {t('networkContentDashboard.noArticles')}
              </Typography>
            </CenteredContainer>
          )}

          {!loading && !error && articles.length > 0 && (
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
          )}
        </PanelColumn>

        <PanelColumn>
          <NetworkMediaList onSelectClient={handleSelectClientFromMedia} />
        </PanelColumn>
      </PageGrid>

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
