import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  Skeleton,
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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdCheck,
  MdClose,
  MdContentCopy,
  MdExpandMore,
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
  id: string;
  check?: SeoCheckId;
  info?: boolean;
  urls?: SeoUrlKey[];
  link?: string;
  internalLink?: string;
  guide?: string[];
}

export interface SeoChecklistSection {
  id: string;
  items: SeoChecklistEntry[];
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
      { id: 'gsc-inspect', link: SEARCH_CONSOLE },
    ],
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
      {
        id: 'seo-titles',
        guide: [
          'topicFirst',
          'length',
          'specific',
          'noClickbait',
          'unique',
          'siteName',
        ],
      },
      {
        id: 'meta-descriptions',
        guide: [
          'summarize',
          'length',
          'addToTitle',
          'details',
          'forPeople',
          'fallback',
        ],
      },
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
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: start;
  max-width: 1120px;
`;

const Content = styled.div`
  display: grid;
  gap: 24px;
  max-width: 960px;
`;

const Actions = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
`;

const RefreshButton = styled(Button)`
  white-space: nowrap;
`;

const Placeholder = styled.div`
  display: grid;
  gap: 24px;
  opacity: 0.5;
  pointer-events: none;
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

const GuideTips = styled.ul`
  margin: 0 0 12px;
  padding-left: 20px;
  display: grid;
  gap: 4px;
`;

const GuideExample = styled.div`
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 8px;
  align-items: start;
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

const WritingGuide = ({ entry }: { entry: SeoChecklistEntry }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const key = `seoChecklist.items.${entry.id}.guide`;

  return (
    <Accordion
      disableGutters
      variant="outlined"
    >
      <AccordionSummary expandIcon={<MdExpandMore />}>
        <Typography variant="body2">{t('seoChecklist.guide.show')}</Typography>
      </AccordionSummary>

      <AccordionDetails>
        <GuideTips>
          {entry.guide?.map(tip => (
            <Typography
              key={tip}
              component="li"
              variant="body2"
            >
              {t(`${key}.tips.${tip}`)}
            </Typography>
          ))}
        </GuideTips>

        <GuideExample>
          <MdCheck
            size={20}
            aria-label={t('seoChecklist.guide.good')}
            color={theme.palette.success.main}
          />
          <Typography variant="body2">
            <q>{t(`${key}.good`)}</q>
          </Typography>

          <MdClose
            size={20}
            aria-label={t('seoChecklist.guide.bad')}
            color={theme.palette.error.main}
          />
          <Typography variant="body2">
            <q>{t(`${key}.bad`)}</q>
          </Typography>
        </GuideExample>
      </AccordionDetails>
    </Accordion>
  );
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
  data?: SeoChecklistData;
  completed?: SeoChecklistItemFragment;
  canUpdate: boolean;
  updating: boolean;
  onToggle(completed: boolean): void;
}) => {
  const { t, i18n } = useTranslation();
  const check = entry.check && data?.checks.find(c => c.id === entry.check);
  const key = `seoChecklist.items.${entry.id}`;

  return (
    <ItemRow data-testid={`seo-item-${entry.id}`}>
      <ItemMarker>
        {(entry.check || entry.info) && !data ?
          <Skeleton
            variant="circular"
            width={24}
            height={24}
          />
        : entry.check || entry.info ?
          <StatusIcon status={check ? check.status : undefined} />
        : <Checkbox
            checked={!!completed}
            disabled={!data || !canUpdate || updating}
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

        {entry.guide && <WritingGuide entry={entry} />}

        {check?.detail && (
          <Typography variant="body2">
            {t([`${key}.detail`, 'seoChecklist.detail'])}:{' '}
            <code>{check.detail}</code>
          </Typography>
        )}

        {data &&
          entry.urls?.map(urlKey => (
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

const ChecklistSection = ({
  section,
  checklist,
  canUpdate,
  updatingId,
  onToggle,
}: {
  section: SeoChecklistSection;
  checklist?: SeoChecklistData;
  canUpdate: boolean;
  updatingId?: string;
  onToggle(itemId: string, completed: boolean): void;
}) => {
  const { t } = useTranslation();

  return (
    <Card
      variant="outlined"
      data-testid={`seo-section-${section.id}`}
    >
      <CardHeader
        title={t(`seoChecklist.sections.${section.id}.title`)}
        subheader={t(`seoChecklist.sections.${section.id}.description`)}
        action={
          checklist ?
            <Chip
              size="small"
              label={t(
                'seoChecklist.progress',
                getSeoChecklistProgress(
                  [section],
                  checklist.checks,
                  checklist.completedItems
                )
              )}
            />
          : <Skeleton width={48} />
        }
      />

      <CardContent>
        <Items>
          {section.items.map(entry => (
            <ChecklistItem
              key={entry.id}
              entry={entry}
              data={checklist}
              completed={checklist?.completedItems.find(
                item => item.itemId === entry.id
              )}
              canUpdate={canUpdate}
              updating={updatingId === entry.id}
              onToggle={completed => onToggle(entry.id, completed)}
            />
          ))}
        </Items>
      </CardContent>
    </Card>
  );
};

function SeoChecklist() {
  const { t } = useTranslation();
  const canUpdate = !!useAuthorisation('CAN_UPDATE_SETTINGS');

  const { data, loading, error, refetch } = useSeoChecklistQuery({
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const [updatingId, setUpdatingId] = useState<string>();
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
  const initialLoading = !checklist && loading;
  const progress =
    checklist &&
    getSeoChecklistProgress(
      SEO_CHECKLIST,
      checklist.checks,
      checklist.completedItems
    );

  const sections = SEO_CHECKLIST.map(section => (
    <ChecklistSection
      key={section.id}
      section={section}
      checklist={checklist}
      canUpdate={canUpdate}
      updatingId={updating ? updatingId : undefined}
      onToggle={(itemId, completed) => {
        setUpdatingId(itemId);
        updateItem({ variables: { itemId, completed } });
      }}
    />
  ));

  return (
    <Wrapper>
      <Content>
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

        {initialLoading && <LinearProgress />}

        {(error || updateError) && (
          <Alert severity="error">{(error ?? updateError)?.message}</Alert>
        )}

        {checklist && sections}

        {initialLoading && (
          <Placeholder
            aria-busy="true"
            data-testid="seo-checklist-placeholder"
          >
            {sections}
          </Placeholder>
        )}
      </Content>

      <Actions>
        <RefreshButton
          variant="outlined"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <MdRefresh />}
          onClick={() => refetch()}
        >
          {t('seoChecklist.refresh')}
        </RefreshButton>
      </Actions>
    </Wrapper>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SETTINGS',
])(SeoChecklist);

export { CheckedPermissionComponent as SeoChecklist };
