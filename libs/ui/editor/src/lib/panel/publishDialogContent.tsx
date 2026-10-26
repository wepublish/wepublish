import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Typography,
} from '@mui/material';
import { SeoCheckStatus } from '@wepublish/editor/api';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCheckCircle, MdError, MdRemove, MdWarning } from 'react-icons/md';

import { DateTimePicker } from '../atoms';

export type PublishCheck = {
  label: string;
  value?: ReactNode;
  missing?: string;
  required?: boolean;
};

const Section = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};

  & + & {
    margin-top: ${({ theme }) => theme.spacing(3)};
  }
`;

const SectionHeader = styled('header')`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Checks = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

const Check = styled('li')`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(1.5)};
  align-items: start;
  padding: ${({ theme }) => theme.spacing(1.25, 2)};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
  }

  svg {
    margin-top: 1px;
  }
`;

const CheckValue = styled(Typography)`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
`;

const Options = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const statusOf = (check: PublishCheck) => {
  if (check.value) {
    return SeoCheckStatus.Ok;
  }

  if (!check.missing) {
    return SeoCheckStatus.Info;
  }

  return check.required ? SeoCheckStatus.Error : SeoCheckStatus.Warning;
};

function StatusIcon({ status }: { status: SeoCheckStatus }) {
  const { t } = useTranslation();
  const props = {
    size: 20,
    role: 'img',
    'aria-label': t(`seoChecklist.status.${status}`),
  };

  switch (status) {
    case SeoCheckStatus.Ok:
      return (
        <MdCheckCircle
          {...props}
          color="var(--mui-palette-success-main)"
        />
      );
    case SeoCheckStatus.Warning:
      return (
        <MdWarning
          {...props}
          color="var(--mui-palette-warning-main)"
        />
      );
    case SeoCheckStatus.Error:
      return (
        <MdError
          {...props}
          color="var(--mui-palette-error-main)"
        />
      );
    default:
      return (
        <MdRemove
          {...props}
          color="var(--mui-palette-text-disabled)"
        />
      );
  }
}

export type PublishDialogContentProps = {
  title: string;
  url?: string;
  publishedAtDate?: Date;
  dateLabel: string;
  dateHelperText?: string;
  pendingMessage?: (publishedAt: Date) => string;
  checks: PublishCheck[];
  options?: string[];
  closeLabel: string;
  onClose(): void;
  onConfirm(publishedAt: Date): void;
};

export function PublishDialogContent({
  title,
  url,
  publishedAtDate,
  dateLabel,
  dateHelperText,
  pendingMessage,
  checks,
  options = [],
  closeLabel,
  onClose,
  onConfirm,
}: PublishDialogContentProps) {
  const { t } = useTranslation();
  const [now] = useState(() => new Date());
  const [publishedAt, setPublishedAt] = useState<Date | undefined>(
    publishedAtDate ?? now
  );

  const statuses = checks.map(statusOf);
  const isBlocked = statuses.includes(SeoCheckStatus.Error);
  const isScheduled = !!publishedAt && publishedAt > now;
  const recommended = checks.filter(check => check.missing);
  const done = recommended.filter(check => check.value).length;

  return (
    <>
      <DialogTitle sx={{ display: 'grid', gap: 0.5 }}>
        {title}
        {url && (
          <Typography
            variant="body2"
            component="span"
            sx={{ overflowWrap: 'anywhere' }}
          >
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {url}
            </Link>
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        <Section>
          <DateTimePicker
            dateTime={publishedAt}
            label={dateLabel}
            helpInfo={dateHelperText}
            changeDate={date => setPublishedAt(date)}
          />

          {isScheduled && pendingMessage && (
            <Alert severity="info">{pendingMessage(publishedAt)}</Alert>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <Typography
              variant="subtitle2"
              component="h3"
            >
              {t('publishDialog.checklist')}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {t('seoChecklist.progress', {
                done,
                total: recommended.length,
              })}
            </Typography>
          </SectionHeader>

          <Checks>
            {checks.map((check, index) => (
              <Check key={check.label}>
                <StatusIcon status={statuses[index]} />

                <div>
                  <Typography
                    variant="body2"
                    color={
                      statuses[index] === SeoCheckStatus.Info ?
                        'text.secondary'
                      : 'text.primary'
                    }
                  >
                    {check.label}
                  </Typography>
                  {(check.value || check.missing) && (
                    <CheckValue
                      variant="caption"
                      color={
                        statuses[index] === SeoCheckStatus.Error ?
                          'error'
                        : 'text.secondary'
                      }
                    >
                      {check.value || check.missing}
                    </CheckValue>
                  )}
                </div>
              </Check>
            ))}
          </Checks>
        </Section>

        {!!options.length && (
          <Section>
            <Typography
              variant="subtitle2"
              component="h3"
            >
              {t('publishDialog.options')}
            </Typography>

            <Options>
              {options.map(option => (
                <Chip
                  key={option}
                  size="small"
                  label={option}
                />
              ))}
            </Options>
          </Section>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={() => onClose()}
        >
          {closeLabel}
        </Button>

        <Button
          variant="contained"
          disabled={!publishedAt || isBlocked}
          onClick={() => publishedAt && onConfirm(publishedAt)}
        >
          {isScheduled ?
            t('publishDialog.schedule')
          : t('publishDialog.publish')}
        </Button>
      </DialogActions>
    </>
  );
}
