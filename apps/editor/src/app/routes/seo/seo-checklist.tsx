import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  SeoCheck,
  SeoCheckId,
  SeoChecklistDocument,
  SeoChecklistItemFragment,
  SeoChecklistQuery,
  SeoCheckStatus,
  useSeoChecklistQuery,
  useUpdateSeoChecklistItemMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import {
  MdCheck,
  MdClose,
  MdContentCopy,
  MdInfoOutline,
  MdOpenInNew,
  MdRefresh,
  MdWarning,
} from 'react-icons/md';
import { Link } from 'react-router-dom';

type SeoChecklistData = SeoChecklistQuery['seoChecklist'];
type SeoUrlKey = keyof Pick<
  SeoChecklistData,
  'sitemapUrl' | 'rssFeedUrl' | 'atomFeedUrl' | 'jsonFeedUrl'
>;

export interface SeoChecklistEntry {
  readonly id: string;
  readonly check?: SeoCheckId;
  readonly info?: boolean;
  readonly urls?: SeoUrlKey[];
  readonly link?: string;
  readonly internalLink?: string;
}

export interface SeoChecklistSection {
  readonly id: string;
  readonly items: SeoChecklistEntry[];
}

const SEARCH_CONSOLE = 'https://search.google.com/search-console';

export const SEO_CHECKLIST: SeoChecklistSection[] = [
  {
    id: 'searchConsole',
    items: [
      { id: 'gsc-verify' },
      { id: 'gsc-sitemap', urls: ['sitemapUrl'] },
      { id: 'gsc-pages' },
      { id: 'gsc-performance' },
      { id: 'gsc-inspect' },
    ].map(item => ({ ...item, link: SEARCH_CONSOLE }) as SeoChecklistEntry),
  },
  {
    id: 'sitemapsFeeds',
    items: [
      { id: 'sitemap', check: SeoCheckId.Sitemap, urls: ['sitemapUrl'] },
      { id: 'news-sitemap', check: SeoCheckId.NewsSitemap },
      {
        id: 'feeds',
        check: SeoCheckId.Feed,
        urls: ['rssFeedUrl', 'atomFeedUrl', 'jsonFeedUrl'],
      },
    ],
  },
  {
    id: 'content',
    items: [
      { id: 'seo-titles' },
      { id: 'meta-descriptions' },
      { id: 'structure' },
      { id: 'internal-links' },
      { id: 'stable-slugs' },
      { id: 'author-pages', internalLink: '/authors' },
    ],
  },
  {
    id: 'presentation',
    items: [
      { id: 'share-images' },
      { id: 'image-descriptions', internalLink: '/images' },
      { id: 'social-texts' },
      { id: 'preview-before-publishing' },
      {
        id: 'publication-profile',
        check: SeoCheckId.PublicationMetadata,
        internalLink: '/peering/profile/edit',
      },
    ],
  },
  {
    id: 'automatic',
    items: [
      { id: 'article-markup', check: SeoCheckId.ArticleMarkup },
      { id: 'canonical-urls', info: true },
      { id: 'hidden-noindex', info: true },
    ],
  },
];

export const isEntryDone = (
  entry: SeoChecklistEntry,
  checks: Pick<SeoCheck, 'id' | 'status'>[],
  completedIds: Set<string>
) => {
  if (entry.info) {
    return true;
  }

  if (entry.check) {
    return (
      checks.find(check => check.id === entry.check)?.status ===
      SeoCheckStatus.Ok
    );
  }

  return completedIds.has(entry.id);
};

export const getSeoChecklistProgress = (
  sections: SeoChecklistSection[],
  checks: Pick<SeoCheck, 'id' | 'status'>[],
  completedItems: Pick<SeoChecklistItemFragment, 'itemId'>[]
) => {
  const completedIds = new Set(completedItems.map(item => item.itemId));
  const entries = sections.flatMap(section => section.items);

  return {
    done: entries.filter(entry => isEntryDone(entry, checks, completedIds))
      .length,
    total: entries.length,
  };
};

const Wrapper = styled.div`
  display: grid;
  gap: 24px;
  max-width: 960px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
`;

const Items = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
`;

const ItemRow = styled.li`
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 8px;
  align-items: start;
`;

const ItemMarker = styled.div`
  display: grid;
  place-items: center;
  height: 42px;
`;

const ItemBody = styled.div`
  display: grid;
  gap: 4px;
  padding-top: 9px;
`;

const ItemTitle = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-weight: 600;
`;

const UrlRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;

  code {
    overflow-wrap: anywhere;
  }
`;

const ItemActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StatusIcon = ({ status }: { status?: SeoCheckStatus }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const label = t(`seoChecklist.status.${status ?? SeoCheckStatus.Info}`);

  switch (status) {
    case SeoCheckStatus.Ok:
      return (
        <MdCheck
          size={24}
          aria-label={label}
          color={theme.palette.success.main}
        />
      );
    case SeoCheckStatus.Warning:
      return (
        <MdWarning
          size={24}
          aria-label={label}
          color={theme.palette.warning.main}
        />
      );
    case SeoCheckStatus.Error:
      return (
        <MdClose
          size={24}
          aria-label={label}
          color={theme.palette.error.main}
        />
      );
    default:
      return (
        <MdInfoOutline
          size={24}
          aria-label={label}
          color={theme.palette.info.main}
        />
      );
  }
};

const ChecklistItem = ({
  entry,
  data,
  completed,
  canUpdate,
  updating,
  onToggle,
}: {
  entry: SeoChecklistEntry;
  data: SeoChecklistData;
  completed?: SeoChecklistItemFragment;
  canUpdate: boolean;
  updating: boolean;
  onToggle(completed: boolean): void;
}) => {
  const { t, i18n } = useTranslation();
  const check = entry.check && data.checks.find(c => c.id === entry.check);
  const key = `seoChecklist.items.${entry.id}`;

  return (
    <ItemRow data-testid={`seo-item-${entry.id}`}>
      <ItemMarker>
        {entry.check || entry.info ?
          <StatusIcon status={check ? check.status : undefined} />
        : <Checkbox
            checked={!!completed}
            disabled={!canUpdate || updating}
            onChange={event => onToggle(event.target.checked)}
            inputProps={{ 'aria-label': t(`${key}.title`) }}
          />
        }
      </ItemMarker>

      <ItemBody>
        <ItemTitle>
          {t(`${key}.title`)}
          {check && (
            <Chip
              size="small"
              variant="outlined"
              label={t(`seoChecklist.checkStatus.${check.status}`)}
            />
          )}
        </ItemTitle>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {t(`${key}.description`)}
        </Typography>

        {check?.detail && (
          <Typography variant="body2">
            {t([`${key}.detail`, 'seoChecklist.detail'])}:{' '}
            <code>{check.detail}</code>
          </Typography>
        )}

        {entry.urls?.map(urlKey => (
          <UrlRow key={urlKey}>
            <code>{data[urlKey]}</code>
            <Tooltip title={t('seoChecklist.copyUrl')}>
              <IconButton
                size="small"
                aria-label={t('seoChecklist.copyUrl')}
                onClick={() => navigator.clipboard.writeText(data[urlKey])}
              >
                <MdContentCopy />
              </IconButton>
            </Tooltip>
          </UrlRow>
        ))}

        {(entry.link || entry.internalLink) && (
          <ItemActions>
            {entry.link && (
              <Button
                size="small"
                href={entry.link}
                target="_blank"
                rel="noreferrer"
                startIcon={<MdOpenInNew />}
              >
                {t(`${key}.action`)}
              </Button>
            )}

            {entry.internalLink && (
              <Link to={entry.internalLink}>
                <Button size="small">{t(`${key}.action`)}</Button>
              </Link>
            )}
          </ItemActions>
        )}

        {completed && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {t(
              completed.completedBy ?
                'seoChecklist.completedBy'
              : 'seoChecklist.completedAt',
              {
                name: completed.completedBy,
                date: new Date(completed.completedAt).toLocaleDateString(
                  i18n.language
                ),
              }
            )}
          </Typography>
        )}
      </ItemBody>
    </ItemRow>
  );
};

function SeoChecklist() {
  const { t } = useTranslation();
  const canUpdate = !!useAuthorisation('CAN_UPDATE_SETTINGS');

  const { data, loading, error, refetch } = useSeoChecklistQuery({
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const [updateItem, { loading: updating, error: updateError }] =
    useUpdateSeoChecklistItemMutation({
      update: (cache, { data: result }) => {
        if (!result) {
          return;
        }

        cache.updateQuery<SeoChecklistQuery>(
          { query: SeoChecklistDocument },
          previous =>
            previous && {
              seoChecklist: {
                ...previous.seoChecklist,
                completedItems: result.updateSeoChecklistItem,
              },
            }
        );
      },
    });

  const checklist = data?.seoChecklist;
  const progress =
    checklist &&
    getSeoChecklistProgress(
      SEO_CHECKLIST,
      checklist.checks,
      checklist.completedItems
    );

  return (
    <Wrapper>
      <Header>
        <div>
          <h3>{t('seoChecklist.title')}</h3>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {t('seoChecklist.description')}
          </Typography>

          {checklist && (
            <Typography
              variant="body2"
              marginTop={1}
            >
              {t('seoChecklist.websiteUrl')}:{' '}
              <code>{checklist.websiteUrl}</code>
            </Typography>
          )}
        </div>

        <Button
          variant="outlined"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <MdRefresh />}
          onClick={() => refetch()}
        >
          {t('seoChecklist.refresh')}
        </Button>
      </Header>

      {progress && (
        <div>
          <Typography variant="body2">
            {t('seoChecklist.progress', progress)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(progress.done / progress.total) * 100}
          />
        </div>
      )}

      {(error || updateError) && (
        <Alert severity="error">{(error ?? updateError)?.message}</Alert>
      )}

      {checklist &&
        SEO_CHECKLIST.map(section => {
          const sectionProgress = getSeoChecklistProgress(
            [section],
            checklist.checks,
            checklist.completedItems
          );

          return (
            <Card
              key={section.id}
              variant="outlined"
              data-testid={`seo-section-${section.id}`}
            >
              <CardHeader
                title={t(`seoChecklist.sections.${section.id}.title`)}
                subheader={t(`seoChecklist.sections.${section.id}.description`)}
                action={
                  <Chip
                    size="small"
                    label={t('seoChecklist.progress', sectionProgress)}
                  />
                }
              />

              <CardContent>
                <Items>
                  {section.items.map(entry => (
                    <ChecklistItem
                      key={entry.id}
                      entry={entry}
                      data={checklist}
                      completed={checklist.completedItems.find(
                        item => item.itemId === entry.id
                      )}
                      canUpdate={canUpdate}
                      updating={updating}
                      onToggle={completed =>
                        updateItem({
                          variables: { itemId: entry.id, completed },
                        })
                      }
                    />
                  ))}
                </Items>
              </CardContent>
            </Card>
          );
        })}
    </Wrapper>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SETTINGS',
])(SeoChecklist);

export { CheckedPermissionComponent as SeoChecklist };
