import styled from '@emotion/styled';
import { Box, Card, Chip, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { MdCalendarToday, MdLanguage, MdOpenInNew } from 'react-icons/md';

// ---- Types ----

interface PeerArticle {
  id: string;
  status: string;
  source_publishedAt: string;
  source_url: string;
  source_title: string;
  source_slug: string;
  source_imageUrl: string | null;
  source_lead: string;
  client: string;
}

interface DirectusResponse {
  data: PeerArticle[];
}

// ---- Custom Hook ----

const DIRECTUS_URL = 'http://0.0.0.0:8055';

function usePeerArticles() {
  const [articles, setArticles] = useState<PeerArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          'filter[status][_eq]': 'published',
          sort: '-source_publishedAt',
          limit: '20',
        });
        const response = await fetch(
          `${DIRECTUS_URL}/items/PeerArticles?${params}`
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

const FeedContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const ArticleLink = styled('a')`
  text-decoration: none;
  display: block;

  &:hover .article-card {
    box-shadow: ${({ theme }) => theme.shadows[8]};
    transform: translateY(-2px);
  }
`;

const ArticleCard = styled(Card, {
  shouldForwardProp: prop => prop !== 'reversed',
})<{ reversed?: boolean }>`
  display: flex;
  flex-direction: ${({ reversed }) => (reversed ? 'row-reverse' : 'row')};
  overflow: hidden;
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;
  min-height: 220px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ImagePane = styled(Box)<{ imageurl: string }>`
  flex: 0 0 42%;
  background-image: url('${({ imageurl }) => imageurl}');
  background-size: cover;
  background-position: center;
  position: relative;

  @media (max-width: 768px) {
    flex: 0 0 auto;
    min-height: 180px;
  }
`;

const ImagePlaceholder = styled(Box)`
  flex: 0 0 42%;
  background: ${({ theme }) => theme.palette.action.hover};
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;

  @media (max-width: 768px) {
    flex: 0 0 auto;
    min-height: 140px;
  }
`;

const ContentPane = styled(Box)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  padding: ${({ theme }) => theme.spacing(3)};
  min-width: 0;
`;

const ArticleTitle = styled(Typography)`
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  color: ${({ theme }) => theme.palette.text.primary};
` as typeof Typography;

const ArticleLead = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.secondary};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  line-height: 1.6;
` as typeof Typography;

const ReadMoreRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  margin-top: ${({ theme }) => theme.spacing(1.5)};
  color: ${({ theme }) => theme.palette.primary.main};
  font-size: 0.82rem;
  font-weight: 600;
`;

const MetaRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(2)};
  flex-wrap: wrap;
`;

const PublisherChip = styled(Chip)`
  font-size: 0.7rem;
  height: 22px;
  background: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
  font-weight: 600;
`;

const DateLabel = styled(Typography)`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.text.disabled};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.4)};
` as typeof Typography;

const CenteredBox = styled(Box)`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(6)};
`;

const ErrorBox = styled(Box)`
  padding: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.palette.error.main};
  text-align: center;
`;

// ---- Article Card Component ----

interface ArticleItemProps {
  article: PeerArticle;
  reversed: boolean;
}

function ArticleItem({ article, reversed }: ArticleItemProps) {
  const { t } = useTranslation();
  const publisher = getPublisherName(article.source_url);
  const date = formatDate(article.source_publishedAt);

  return (
    <ArticleLink
      href={article.source_url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <ArticleCard
        className="article-card"
        elevation={2}
        reversed={reversed}
      >
        {article.source_imageUrl ?
          <ImagePane imageurl={article.source_imageUrl} />
        : <ImagePlaceholder>
            <MdLanguage
              size={48}
              style={{ opacity: 0.25 }}
            />
          </ImagePlaceholder>
        }

        <ContentPane>
          <Box>
            <ArticleTitle variant="h6">{article.source_title}</ArticleTitle>

            {article.source_lead && (
              <ArticleLead variant="body2">{article.source_lead}</ArticleLead>
            )}

            <ReadMoreRow>
              {t('networkContentDashboard.readMore')}
              <MdOpenInNew size={13} />
            </ReadMoreRow>
          </Box>

          <MetaRow>
            <PublisherChip
              label={publisher}
              size="small"
            />
            {date && (
              <DateLabel component="span">
                <MdCalendarToday size={12} />
                {date}
              </DateLabel>
            )}
          </MetaRow>
        </ContentPane>
      </ArticleCard>
    </ArticleLink>
  );
}

// ---- Main Export ----

export default function NetworkContentDashboard() {
  const { t } = useTranslation();
  const { articles, loading, error } = usePeerArticles();

  if (loading) {
    return (
      <CenteredBox>
        <CircularProgress />
      </CenteredBox>
    );
  }

  if (error) {
    return (
      <ErrorBox>
        <Typography>{t('networkContentDashboard.errorLoading')}</Typography>
      </ErrorBox>
    );
  }

  if (articles.length === 0) {
    return (
      <Box
        p={3}
        textAlign="center"
      >
        <Typography color="textSecondary">
          {t('networkContentDashboard.noArticles')}
        </Typography>
      </Box>
    );
  }

  return (
    <FeedContainer>
      {articles.map((article, index) => (
        <ArticleItem
          key={article.id}
          article={article}
          reversed={index % 2 === 1}
        />
      ))}
    </FeedContainer>
  );
}
