import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ChangelogEntriesDocument,
  ChangelogEntryFragment,
  ChangelogSeverity,
  MarkNotificationsReadDocument,
  NotificationReadsDocument,
  NotificationSource,
} from '@wepublish/editor/api';
import { NotificationItem, useHasPermission } from '@wepublish/ui/editor';
import {
  ComponentProps,
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAutoAwesome,
  MdClose,
  MdErrorOutline,
  MdExpandMore,
} from 'react-icons/md';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import {
  ACTION_SEVERITIES,
  ChangelogMarkdown,
  CONFIRM_PERMISSION,
  useChangelogDialogs,
} from '../routes/dashboard/changelogDashboard';
import { ChangelogSeverityChip } from '../routes/dashboard/changelogSeverity';
import { isContentEditorRoute } from './contentEditorRoute';

/**
 * "What's new" — where the changelog lives in the editor.
 *
 * Most people never need the changelog, so it gets no room of its own: one
 * icon at the bottom of the sidebar opens a side panel, and a small dot on it
 * says that something new arrived that this user hasn't seen yet (opening the
 * panel marks the shown entries read for them, on every device). In the
 * panel, entries are a quiet list of headings grouped by month that expand in
 * place — no modal on top of a modal.
 *
 * Actions only reach the people who can complete them (the ones allowed to
 * sign them off): one summary line on the dashboard, a "To do" section at
 * the top of the panel, and — only for required actions — a slim banner above
 * every page except the content editors, which can be snoozed for a day.
 */

const SNOOZE_STORAGE_PREFIX = 'wepublish/changelogSnoozedUntil/';
const SNOOZE_MS = 24 * 60 * 60 * 1000;
const RECENT_ENTRIES = 30;

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage blocked: the snooze just doesn't survive a reload
  }
};

type WhatsNewContextValue = {
  open: () => void;
  /** Whether a recent entry waits that this user hasn't seen yet */
  hasUnseen: boolean;
};

const WhatsNewContext = createContext<WhatsNewContextValue>({
  open: () => undefined,
  hasUnseen: false,
});

export const useWhatsNew = () => useContext(WhatsNewContext);

function useRecentEntries(skip = false) {
  const { i18n } = useTranslation();

  const { data } = useQuery(ChangelogEntriesDocument, {
    fetchPolicy: 'cache-and-network',
    skip,
    variables: { take: RECENT_ENTRIES, locale: i18n.language },
  });

  return skip ? [] : (data?.changelogEntries.nodes ?? []);
}

/** Open actions, but only for the people who may sign them off. */
function useOpenActions(skip = false) {
  const { i18n } = useTranslation();
  const mayConfirm = useHasPermission(CONFIRM_PERMISSION);

  const { data } = useQuery(ChangelogEntriesDocument, {
    fetchPolicy: 'cache-and-network',
    skip: skip || !mayConfirm,
    variables: {
      take: 100,
      filter: { severities: ACTION_SEVERITIES, confirmed: false },
      locale: i18n.language,
    },
  });

  if (skip || !mayConfirm) {
    return [];
  }

  // Required first: those are the ones that hurt while they wait.
  return [...(data?.changelogEntries.nodes ?? [])].sort(
    (a, b) =>
      Number(b.severity === ChangelogSeverity.Required) -
      Number(a.severity === ChangelogSeverity.Required)
  );
}

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(2, 2, 1, 3)};
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(0, 2, 2)};
`;

const SectionTitle = styled.h3`
  margin: ${({ theme }) => theme.spacing(2, 1, 1)};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const TodoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const EntrySummary = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const EntryTitle = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  font-weight: 600;
`;

const NewDot = styled.span`
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.vars.palette.primary.main};
`;

const EntryDate = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const EntryLead = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(1)};
`;

const PanelFooter = styled.div`
  padding: ${({ theme }) => theme.spacing(1, 2)};
  border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
`;

function groupByMonth(entries: ChangelogEntryFragment[], locale: string) {
  const format = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  });
  const groups = new Map<string, ChangelogEntryFragment[]>();

  for (const entry of entries) {
    const month = format.format(new Date(entry.releasedAt));
    groups.set(month, [...(groups.get(month) ?? []), entry]);
  }

  return [...groups.entries()];
}

function WhatsNewPanel({
  open,
  newIds,
  onClose,
}: {
  open: boolean;
  /** Entries that were unseen when the panel opened get a dot. */
  newIds: ReadonlySet<string>;
  onClose(): void;
}) {
  const { t, i18n } = useTranslation();
  const entries = useRecentEntries(!open);
  const actions = useOpenActions(!open);
  const { overlay, confirm } = useChangelogDialogs();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [openTodo, setOpenTodo] = useState<string | null>(null);

  const dayFormat = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
  });

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', sm: 440 }, display: 'flex' },
          },
        }}
      >
        <PanelHeader>
          <Typography
            variant="h2"
            component="h2"
          >
            {t('changelog.panel.title')}
          </Typography>

          <IconButton
            aria-label={t('close')}
            onClick={onClose}
          >
            <MdClose />
          </IconButton>
        </PanelHeader>

        <PanelBody>
          {!!actions.length && (
            <section>
              <SectionTitle>{t('changelog.panel.todo')}</SectionTitle>

              <TodoList>
                {actions.map(entry => (
                  <NotificationItem
                    key={entry.id}
                    severity={
                      entry.severity === ChangelogSeverity.Required ?
                        'error'
                      : 'warning'
                    }
                    title={entry.title}
                    tags={<ChangelogSeverityChip entry={entry} />}
                    actions={
                      <>
                        {entry.description && (
                          <Button
                            size="small"
                            aria-expanded={openTodo === entry.id}
                            onClick={() =>
                              setOpenTodo(
                                openTodo === entry.id ? null : entry.id
                              )
                            }
                          >
                            {t('changelog.details')}
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => confirm(entry)}
                        >
                          {t('notifications.markAsDone')}
                        </Button>
                      </>
                    }
                  >
                    <EntryLead>{entry.lead}</EntryLead>
                    {entry.description && openTodo === entry.id && (
                      <ChangelogMarkdown>{entry.description}</ChangelogMarkdown>
                    )}
                  </NotificationItem>
                ))}
              </TodoList>
            </section>
          )}

          {groupByMonth(entries, i18n.language).map(([month, monthEntries]) => (
            <section key={month}>
              <SectionTitle>{month}</SectionTitle>

              {monthEntries.map(entry => (
                <Accordion
                  key={entry.id}
                  disableGutters
                  elevation={0}
                  square
                  expanded={expanded === entry.id}
                  onChange={(_, isExpanded) =>
                    setExpanded(isExpanded ? entry.id : false)
                  }
                  sx={{ '&::before': { display: 'none' }, background: 'none' }}
                >
                  <AccordionSummary expandIcon={<MdExpandMore />}>
                    <EntrySummary>
                      <EntryTitle>
                        {newIds.has(entry.id) && (
                          <NewDot
                            title={t('changelog.panel.new')}
                            aria-label={t('changelog.panel.new')}
                          />
                        )}
                        {entry.title}
                        <ChangelogSeverityChip entry={entry} />
                      </EntryTitle>
                      <EntryDate>
                        {dayFormat.format(new Date(entry.releasedAt))}
                      </EntryDate>
                    </EntrySummary>
                  </AccordionSummary>

                  <AccordionDetails>
                    <EntryLead>{entry.lead}</EntryLead>
                    {entry.description && (
                      <ChangelogMarkdown>{entry.description}</ChangelogMarkdown>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </section>
          ))}
        </PanelBody>

        <PanelFooter>
          <Button
            component={RouterLink}
            to="/notifications"
            onClick={onClose}
          >
            {t('changelog.panel.fullChangelog')}
          </Button>
        </PanelFooter>
      </Drawer>

      {overlay}
    </>
  );
}

/** Hosts the panel and knows which entries this user hasn't seen yet. */
export function WhatsNewProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  // What was unseen *when the panel opened*, so the dots stay while reading.
  const [newIds, setNewIds] = useState<ReadonlySet<string>>(new Set());
  const recent = useRecentEntries();

  const { data } = useQuery(NotificationReadsDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const [markNotificationsRead] = useMutation(MarkNotificationsReadDocument, {
    refetchQueries: ['NotificationReads'],
  });

  const unseenIds = useMemo(() => {
    const read = new Set(
      (data?.notificationReads ?? [])
        .filter(({ source }) => source === NotificationSource.Changelog)
        .map(({ itemId }) => itemId)
    );

    return recent.map(({ id }) => id).filter(id => !read.has(id));
  }, [data?.notificationReads, recent]);

  const open = useCallback(() => {
    setNewIds(new Set(unseenIds));
    setOpen(true);

    if (unseenIds.length) {
      markNotificationsRead({
        variables: { source: NotificationSource.Changelog, itemIds: unseenIds },
      });
    }
  }, [markNotificationsRead, unseenIds]);

  const value = useMemo(
    () => ({ open, hasUnseen: !isOpen && unseenIds.length > 0 }),
    [open, isOpen, unseenIds.length]
  );

  return (
    <WhatsNewContext.Provider value={value}>
      {children}

      <WhatsNewPanel
        open={isOpen}
        newIds={newIds}
        onClose={() => setOpen(false)}
      />
    </WhatsNewContext.Provider>
  );
}

const IconWithDot = styled.span`
  position: relative;
  display: inline-flex;
`;

const UnseenDot = styled.span`
  position: absolute;
  top: -2px;
  right: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.vars.palette.primary.main};
  box-shadow: 0 0 0 2px ${({ theme }) => theme.vars.palette.background.paper};
`;

/** The sidebar entry point, with a dot while something unseen waits. */
export function WhatsNewButton({
  ButtonComponent = IconButton,
}: {
  /** Lets the sidebar pass its own styled icon button. */
  ButtonComponent?: ComponentType<ComponentProps<typeof IconButton>>;
} = {}) {
  const { t } = useTranslation();
  const { open, hasUnseen } = useWhatsNew();

  return (
    <Tooltip title={t('changelog.panel.title')}>
      <ButtonComponent
        aria-label={t('changelog.panel.title')}
        onClick={open}
      >
        <IconWithDot>
          <MdAutoAwesome />
          {hasUnseen && <UnseenDot data-testid="whats-new-dot" />}
        </IconWithDot>
      </ButtonComponent>
    </Tooltip>
  );
}

/** One summary line for the dashboard notifications card, admins only. */
export function useWhatsNewDashboardItems() {
  const { t } = useTranslation();
  const { open } = useWhatsNew();
  const actions = useOpenActions();

  if (!actions.length) {
    return { items: [] };
  }

  const required = actions.some(
    entry => entry.severity === ChangelogSeverity.Required
  );

  return {
    items: [
      <NotificationItem
        key="whats-new-open-actions"
        severity={required ? 'error' : 'warning'}
        title={t('changelog.panel.openSteps', { count: actions.length })}
        actions={
          <Button
            size="small"
            variant="outlined"
            onClick={open}
          >
            {t('changelog.panel.show')}
          </Button>
        }
      />,
    ],
  };
}

const Banner = styled.div`
  position: sticky;
  /* Flush with the edges of the padded, scrolling main area. */
  flex-shrink: 0;
  top: calc(-1 * var(--wep-page-padding-y, 0px));
  margin: calc(-1 * var(--wep-page-padding-y, 0px))
    calc(-1 * var(--wep-page-padding-x, 0px)) var(--wep-page-padding-y, 0px);
  z-index: ${({ theme }) => theme.zIndex.appBar};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(0.75, 2)};
  background: ${({ theme }) => theme.vars.palette.error.main};
  color: ${({ theme }) => theme.vars.palette.error.contrastText};
  font-size: 0.875rem;

  > svg {
    flex-shrink: 0;
    font-size: 20px;
  }
`;

const BannerText = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const isSnoozed = (id: string) =>
  Number(readStorage(SNOOZE_STORAGE_PREFIX + id) ?? 0) > Date.now();

/** Open required actions above every page, for admins, snoozable per day. */
export function WhatsNewRequiredBanner() {
  const { t } = useTranslation();
  const { open } = useWhatsNew();
  const [, rerender] = useState(0);
  const { pathname } = useLocation();
  const required = useOpenActions(isContentEditorRoute(pathname)).filter(
    entry =>
      entry.severity === ChangelogSeverity.Required && !isSnoozed(entry.id)
  );

  if (!required.length) {
    return null;
  }

  const [first] = required;

  return (
    <Banner role="status">
      <MdErrorOutline aria-hidden />

      <BannerText>
        <strong>{first.title}</strong>
        {required.length > 1 &&
          ` ${t('changelog.panel.moreRequired', { count: required.length - 1 })}`}
      </BannerText>

      <Button
        size="small"
        color="inherit"
        variant="outlined"
        onClick={open}
      >
        {t('changelog.panel.show')}
      </Button>

      <Button
        size="small"
        color="inherit"
        onClick={() => {
          required.forEach(entry =>
            writeStorage(
              SNOOZE_STORAGE_PREFIX + entry.id,
              String(Date.now() + SNOOZE_MS)
            )
          );
          rerender(count => count + 1);
        }}
      >
        {t('changelog.panel.snooze')}
      </Button>
    </Banner>
  );
}
