import styled from '@emotion/styled';
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  useImportPeerArticleMutation,
  usePeerListQuery,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { MdDownload, MdInfoOutline } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

// ---- Types ----

interface PeerArticle {
  id: string;
  status: string;
  source_id: string;
  source_publishedAt: string;
  source_url: string;
  source_title: string;
  source_slug: string;
  source_imageUrl: string | null;
  source_lead: string;
  client: {
    apiUrl: string | null;
  };
}

interface DirectusResponse {
  data: PeerArticle[];
}

interface PeerMatch {
  peerId: string;
  peerName: string;
}

// ---- Custom Hook ----

const DIRECTUS_URL = 'http://0.0.0.0:8055';

const PEER_ARTICLES_PARAMS = new URLSearchParams({
  'filter[status][_eq]': 'published',
  sort: '-source_publishedAt',
  limit: '20',
  'fields[]': [
    'id',
    'status',
    'source_id',
    'source_publishedAt',
    'source_url',
    'source_title',
    'source_slug',
    'source_imageUrl',
    'source_lead',
    'client.apiUrl',
  ].join(','),
});

function usePeerArticles() {
  const [articles, setArticles] = useState<PeerArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch(
          `${DIRECTUS_URL}/items/PeerArticles?${PEER_ARTICLES_PARAMS}`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json: DirectusResponse = await response.json();
        if (!cancelled) {
          setArticles(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { articles, loading, error };
}

// ---- Helpers ----

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

function getPublisherName(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd.MM.yyyy');
  } catch {
    return '';
  }
}

// ---- Styled Components ----

const ScrollContainer = styled('div')`
  max-height: 600px;
  overflow-y: auto;
`;

const FeedList = styled('div')`
  display: flex;
  flex-direction: column;
`;

const ArticleRow = styled('div')`
  display: grid;
  grid-template-columns: 140px 1fr 120px;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(1.5)} 0;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

const ArticleLink = styled('a')`
  text-decoration: none;
  color: inherit;
  display: contents;

  &:hover,
  &:focus,
  &:active {
    text-decoration: none;
  }
`;

const ArticleImage = styled('img')`
  width: 140px;
  height: 90px;
  object-fit: cover;
  display: block;
  border-radius: 2px;
`;

const ImagePlaceholder = styled('div')`
  width: 140px;
  height: 90px;
  background: ${({ theme }) => theme.palette.action.disabledBackground};
  border-radius: 2px;
`;

const ContentArea = styled('div')`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
`;

const ArticleTitle = styled(Typography)`
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.3;
  color: ${({ theme }) => theme.palette.text.primary};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const ArticleLead = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: 0.78rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-top: ${({ theme }) => theme.spacing(0.25)};
`;

const MetaLine = styled(Typography)`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.palette.text.disabled};
  margin-top: ${({ theme }) => theme.spacing(0.5)};
`;

const ActionColumn = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const PublisherName = styled(Typography)`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.secondary};
  text-align: center;
  line-height: 1.2;
`;

const CenteredContainer = styled('div')`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(4)};
`;

// ---- Article Item ----

interface ArticleItemProps {
  article: PeerArticle;
  peerMatch: PeerMatch | null;
  onImport: (peerId: string, articleId: string) => void;
  onShowPeerInfo: () => void;
}

function ArticleItem({
  article,
  peerMatch,
  onImport,
  onShowPeerInfo,
}: ArticleItemProps) {
  const { t } = useTranslation();
  const publisher = getPublisherName(article.source_url);
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
            <IconButton
              size="small"
              color="primary"
              onClick={() => onImport(peerMatch.peerId, article.source_id)}
            >
              <MdDownload />
            </IconButton>
          </Tooltip>
        : <Tooltip title={t('networkContentDashboard.noPeer')}>
            <IconButton
              size="small"
              color="default"
              onClick={onShowPeerInfo}
            >
              <MdInfoOutline />
            </IconButton>
          </Tooltip>
        }
      </ActionColumn>
    </ArticleRow>
  );
}

// ---- Main Export ----

export default function NetworkContentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { articles, loading: articlesLoading, error } = usePeerArticles();
  const { data: peerData, loading: peersLoading } = usePeerListQuery({
    errorPolicy: 'ignore',
  });

  const [articleToImport, setArticleToImport] = useState<{
    peerId: string;
    articleId: string;
  }>();
  const [importOptions, setImportOptions] = useState({
    importAuthors: true,
    importTags: true,
    importContentImages: true,
  });
  const [peerInfoOpen, setPeerInfoOpen] = useState(false);

  const [importPeerArticle, { loading: importing }] =
    useImportPeerArticleMutation({
      onCompleted(data) {
        setArticleToImport(undefined);
        navigate(`/articles/edit/${data.importPeerArticle.id}`);
      },
    });

  const peers = peerData?.peers ?? [];

  const peerByApiUrl = new Map<string, PeerMatch>();
  for (const peer of peers) {
    if (!peer.isDisabled && peer.hostURL) {
      peerByApiUrl.set(normalizeUrl(peer.hostURL), {
        peerId: peer.id,
        peerName: peer.name,
      });
    }
  }

  function findPeerMatch(clientApiUrl: string | null): PeerMatch | null {
    if (!clientApiUrl) return null;
    return peerByApiUrl.get(normalizeUrl(clientApiUrl)) ?? null;
  }

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
            <ArticleItem
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

      {/* Import Dialog */}
      <Dialog
        open={!!articleToImport}
        onClose={() => setArticleToImport(undefined)}
      >
        <DialogTitle>{t('networkContentDashboard.importTitle')}</DialogTitle>
        <DialogContent>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.importAuthors}
                  onChange={(_, checked) =>
                    setImportOptions(prev => ({
                      ...prev,
                      importAuthors: checked,
                    }))
                  }
                />
              }
              label={t('networkContentDashboard.importAuthors')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.importTags}
                  onChange={(_, checked) =>
                    setImportOptions(prev => ({ ...prev, importTags: checked }))
                  }
                />
              }
              label={t('networkContentDashboard.importTags')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.importContentImages}
                  onChange={(_, checked) =>
                    setImportOptions(prev => ({
                      ...prev,
                      importContentImages: checked,
                    }))
                  }
                />
              }
              label={t('networkContentDashboard.importImages')}
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setArticleToImport(undefined)}
            disabled={importing}
          >
            {t('networkContentDashboard.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={importing}
            onClick={() => {
              if (!articleToImport) return;
              importPeerArticle({
                variables: {
                  peerId: articleToImport.peerId,
                  articleId: articleToImport.articleId,
                  options: importOptions,
                },
              });
            }}
          >
            {t('networkContentDashboard.importConfirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Peer Info Dialog */}
      <Dialog
        open={peerInfoOpen}
        onClose={() => setPeerInfoOpen(false)}
      >
        <DialogTitle>{t('networkContentDashboard.peerInfoTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('networkContentDashboard.peerInfoText')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPeerInfoOpen(false)}>
            {t('networkContentDashboard.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
