import { useMutation } from '@apollo/client/react';
import { ImportPeerArticleDocument } from '@wepublish/editor/api';
import { ListViewContainer, ListViewHeader } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader, Pagination } from 'rsuite';

import {
  ARTICLES_PER_PAGE,
  useAllNetworkClients,
  useNetworkClients,
  usePeerArticles,
  usePeerMatching,
} from './networkContent.hooks';
import {
  Card,
  CardCount,
  CardFooter,
  CardHeader,
  CenteredContainer,
  ErrorText,
  FeedList,
  PageGrid,
} from './networkContent.styles';
import type {
  ArticleFilterParams,
  ArticleToImport,
  ImportOptions,
  WepOneClient,
} from './networkContent.types';
import { NetworkContentArticleFilters } from './networkContentArticleFilters';
import { NetworkContentArticleItem } from './networkContentArticleItem';
import { NetworkContentImportDialog } from './networkContentImportDialog';
import { NetworkMediaList } from './networkContentMediaList';
import { NetworkContentPeerInfoDialog } from './networkContentPeerInfoDialog';

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
  const [peerInfoClient, setPeerInfoClient] = useState<WepOneClient | null>(
    null
  );

  const [importPeerArticle, { loading: importing }] = useMutation(
    ImportPeerArticleDocument,
    {
      onCompleted(data) {
        setArticleToImport(undefined);
        navigate(`/articles/edit/${data.importPeerArticle.id}`);
      },
    }
  );

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
        <Card aria-labelledby="network-articles-title">
          <CardHeader>
            <h3 id="network-articles-title">
              {t('networkContentPage.articlesTitle')}
            </h3>
            {!loading && !error && <CardCount>{articleTotalCount}</CardCount>}
          </CardHeader>

          <NetworkContentArticleFilters
            filters={filters}
            clients={allClients}
            onFiltersChange={handleFiltersChange}
          />

          {loading && (
            <CenteredContainer>
              <Loader />
            </CenteredContainer>
          )}

          {!loading && error && (
            <CenteredContainer>
              <ErrorText>{t('networkContentDashboard.errorLoading')}</ErrorText>
            </CenteredContainer>
          )}

          {!loading && !error && articles.length === 0 && (
            <CenteredContainer>
              {t('networkContentDashboard.noArticles')}
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
                  onShowPeerInfo={() =>
                    handleShowPeerInfo(article.client?.apiUrl ?? null)
                  }
                />
              ))}
            </FeedList>
          )}

          {!loading && !error && articleTotalPages > 1 && (
            <CardFooter>
              <Pagination
                prev
                next
                size="sm"
                maxButtons={5}
                total={articleTotalCount}
                limit={ARTICLES_PER_PAGE}
                activePage={articlePage + 1}
                onChangePage={nextPage => setArticlePage(nextPage - 1)}
              />
            </CardFooter>
          )}
        </Card>

        <NetworkMediaList
          clients={clients}
          totalCount={clientTotalCount}
          loading={clientsLoading}
          error={clientsError}
          page={clientPage}
          onPageChange={setClientPage}
          findPeerMatch={findPeerMatch}
          onConnectClient={setPeerInfoClient}
        />
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
