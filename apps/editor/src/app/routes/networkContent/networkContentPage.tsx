import { CircularProgress, IconButton, Typography } from '@mui/material';
import { useImportPeerArticleMutation } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { ListViewContainer, ListViewHeader } from '@wepublish/ui/editor';

import type {
  ArticleFilterParams,
  ArticleToImport,
  DirectusClient,
  ImportOptions,
} from './networkContent.types';
import {
  ARTICLES_PER_PAGE,
  useAllNetworkClients,
  useNetworkClients,
  usePeerArticles,
  usePeerMatching,
} from './networkContent.hooks';
import {
  CenteredContainer,
  FeedList,
  PageGrid,
  PaginationBar,
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
  const [articlePage, setArticlePage] = useState(0);
  const [clientPage, setClientPage] = useState(0);

  const {
    articles,
    totalCount: articleTotalCount,
    loading: articlesLoading,
    error,
  } = usePeerArticles(filters, articlePage);
  const { findPeerMatch, loading: peersLoading } = usePeerMatching();
  const {
    clients,
    totalCount: clientTotalCount,
    loading: clientsLoading,
    error: clientsError,
  } = useNetworkClients(clientPage);

  // All clients (lightweight) for the filter dropdown
  const allClients = useAllNetworkClients();

  const [articleToImport, setArticleToImport] = useState<ArticleToImport>();
  const [importOptions, setImportOptions] = useState<ImportOptions>(
    DEFAULT_IMPORT_OPTIONS
  );
  const [peerInfoClient, setPeerInfoClient] = useState<DirectusClient | null>(
    null
  );

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
    setArticlePage(0);
  };

  const handleFiltersChange = (newFilters: ArticleFilterParams) => {
    setFilters(newFilters);
    setArticlePage(0);
  };

  const handleShowPeerInfo = (clientApiUrl: string | null) => {
    const match = clients.find(
      c =>
        c.apiUrl &&
        clientApiUrl &&
        c.apiUrl.trim().toLowerCase() === clientApiUrl.trim().toLowerCase()
    );
    if (match) {
      setPeerInfoClient(match);
    } else {
      // Create a minimal placeholder client
      setPeerInfoClient({
        name: '',
        apiUrl: clientApiUrl,
        allowedUsers: [],
      });
    }
  };

  const loading = articlesLoading || peersLoading;
  const articleTotalPages = Math.max(
    1,
    Math.ceil(articleTotalCount / ARTICLES_PER_PAGE)
  );

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
            clients={allClients}
            onFiltersChange={handleFiltersChange}
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
            <>
              <FeedList>
                {articles.map(article => (
                  <NetworkContentArticleItem
                    key={article.id}
                    article={article}
                    peerMatch={findPeerMatch(article.client?.apiUrl)}
                    onImport={(peerId, articleId) =>
                      setArticleToImport({ peerId, articleId })
                    }
                    onShowPeerInfo={() =>
                      handleShowPeerInfo(article.client?.apiUrl ?? null)
                    }
                  />
                ))}
              </FeedList>

              {articleTotalPages > 1 && (
                <PaginationBar>
                  <IconButton
                    size="small"
                    disabled={articlePage === 0}
                    onClick={() => setArticlePage(articlePage - 1)}
                  >
                    <MdChevronLeft />
                  </IconButton>
                  <Typography variant="body2">
                    {articlePage + 1} / {articleTotalPages}
                  </Typography>
                  <IconButton
                    size="small"
                    disabled={articlePage >= articleTotalPages - 1}
                    onClick={() => setArticlePage(articlePage + 1)}
                  >
                    <MdChevronRight />
                  </IconButton>
                </PaginationBar>
              )}
            </>
          )}
        </PanelColumn>

        <PanelColumn>
          <NetworkMediaList
            clients={clients}
            totalCount={clientTotalCount}
            loading={clientsLoading}
            error={clientsError}
            page={clientPage}
            onPageChange={setClientPage}
            findPeerMatch={findPeerMatch}
            onSelectClient={handleSelectClientFromMedia}
            onConnectClient={setPeerInfoClient}
          />
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
        client={peerInfoClient}
        onClose={() => setPeerInfoClient(null)}
      />
    </>
  );
}
