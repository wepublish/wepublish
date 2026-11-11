import styled from '@emotion/styled';
import { Button, IconButton, Tooltip } from '@mui/material';
import { ChangelogEntryFragment } from '@wepublish/editor/api';
import { NotificationSeverity, SEVERITY_ORDER } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import {
  MdCheck,
  MdCheckCircleOutline,
  MdErrorOutline,
  MdInfoOutline,
  MdWarningAmber,
} from 'react-icons/md';

import {
  ChangelogSeverityChip,
  isOpenChangelogAction,
} from '../changelogSeverity';

/**
 * DRAFT 1 — a changelog entry as one dense row instead of a full alert box.
 * Info entries are just their heading; the lead and description wait behind
 * "Read more". Open actions keep a one-line lead, since that line is the
 * instruction.
 */
const Row = styled.div<{ severity: NotificationSeverity }>`
  order: ${({ severity }) => SEVERITY_ORDER[severity]};
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(1, 1.5)};
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-left: 3px solid
    ${({ theme, severity }) => theme.vars.palette[severity].main};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.vars.palette.background.paper};
`;

const Icon = styled.span<{ severity: NotificationSeverity }>`
  display: flex;
  font-size: 20px;
  color: ${({ theme, severity }) => theme.vars.palette[severity].main};
`;

const Main = styled.div`
  min-width: 0;
`;

const TitleLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

const Title = styled.span`
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Date = styled.span`
  flex-shrink: 0;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-size: 0.8125rem;
`;

const Lead = styled.p`
  margin: 2px 0 0;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const ICONS: Record<NotificationSeverity, typeof MdInfoOutline> = {
  info: MdInfoOutline,
  warning: MdWarningAmber,
  error: MdErrorOutline,
  success: MdCheckCircleOutline,
};

export interface ChangelogCompactRowProps {
  /** Read by the dashboard to pick and sort its items. */
  severity: NotificationSeverity;
  entry: ChangelogEntryFragment;
  /** Ignored: the row is already as compact as it gets. */
  compact?: boolean;
  onOpen(): void;
  /** Only passed for users who may sign the action off. */
  onConfirm?(): void;
  onMarkRead?(): void;
}

export function ChangelogCompactRow({
  severity,
  entry,
  onOpen,
  onConfirm,
  onMarkRead,
}: ChangelogCompactRowProps) {
  const { t, i18n } = useTranslation();
  const SeverityIcon = ICONS[severity];
  const openAction = isOpenChangelogAction(entry);

  return (
    <Row
      severity={severity}
      data-testid="changelog-compact-row"
    >
      <Icon
        severity={severity}
        aria-hidden
      >
        <SeverityIcon />
      </Icon>

      <Main>
        <TitleLine>
          <Title title={entry.title}>{entry.title}</Title>
          <ChangelogSeverityChip entry={entry} />
          <Date>
            {new Intl.DateTimeFormat(i18n.language, {
              day: 'numeric',
              month: 'short',
            }).format(new globalThis.Date(entry.releasedAt))}
          </Date>
        </TitleLine>

        {openAction && <Lead title={entry.lead}>{entry.lead}</Lead>}
      </Main>

      <Actions>
        {openAction && onConfirm && (
          <Button
            size="small"
            variant="outlined"
            onClick={onConfirm}
          >
            {t('notifications.markAsDone')}
          </Button>
        )}

        <Button
          size="small"
          variant="text"
          onClick={onOpen}
        >
          {t('changelog.readMore')}
        </Button>

        {!openAction && onMarkRead && (
          <Tooltip title={t('notifications.markAsRead')}>
            <IconButton
              size="small"
              aria-label={t('notifications.markAsRead')}
              onClick={onMarkRead}
            >
              <MdCheck />
            </IconButton>
          </Tooltip>
        )}
      </Actions>
    </Row>
  );
}
