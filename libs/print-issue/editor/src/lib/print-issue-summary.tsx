import { PrintIssueSummaryFieldsFragment } from '@wepublish/editor/api';
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDay } from './common';

/** Above this share of «Restexemplar» rows the historic issues or the quota are probably wrong. */
export const GRACE_WARNING_SHARE = 0.05;

type Count = { key: string; count: number };

function CountList({ counts }: { counts: Count[] }) {
  const { t } = useTranslation();

  if (!counts.length) {
    return (
      <Typography color="text.secondary">
        {t('printIssues.summary.none')}
      </Typography>
    );
  }

  return (
    <Stack
      component="dl"
      sx={{
        m: 0,
        display: 'grid',
        gridTemplateColumns: 'max-content 1fr',
        gap: '2px 12px',
      }}
    >
      {counts.map(({ key, count }) => (
        <Stack
          key={key}
          direction="row"
          component="div"
          sx={{ display: 'contents' }}
        >
          <Typography
            component="dt"
            color="text.secondary"
          >
            {key}
          </Typography>
          <Typography component="dd">{count}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function SummaryCard({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
      <Card
        variant="outlined"
        sx={{ height: '100%' }}
      >
        <CardHeader
          title={title}
          slotProps={{ title: { variant: 'subtitle1' } }}
        />
        <CardContent sx={{ pt: 0 }}>{children}</CardContent>
      </Card>
    </Grid>
  );
}

/** What one run found: the counts the Worker's page showed, plus the quota and gift rows. */
export function PrintIssueSummary({
  summary,
}: {
  summary: PrintIssueSummaryFieldsFragment;
}) {
  const { t } = useTranslation();
  const reasons = (
    [
      'donation',
      'excludedPlan',
      'future',
      'unpaidDeactivation',
      'replaced',
      'deactivated',
      'lapsed',
      'exhausted',
      'noPrintIssues',
    ] as const
  )
    .map(reason => ({
      key: t(`printIssues.summary.skipped.${reason}`),
      count: summary.skipped[reason],
    }))
    .filter(entry => entry.count > 0);
  const hints = (
    [
      ['unpaid', summary.unpaid],
      ['openWithoutInvoice', summary.openWithoutInvoice],
      ['grace', summary.grace],
      ['gifts', summary.gifts],
      ['kuendigungen', summary.kuendigungen],
      ['missingAddress', summary.missingAddress],
      ['placeholderEmail', summary.placeholderEmail],
      ['duplicates', summary.duplicates],
      ['alreadyExported', summary.alreadyExported],
    ] as const
  )
    .map(([key, count]) => ({
      key: t(`printIssues.summary.hints.${key}`),
      count,
    }))
    .filter(entry => entry.count > 0);
  const bexio = summary.bexio;
  const bexioStats = (
    [
      ['invoicesInWindow', bexio.invoicesInWindow],
      ['canceled', bexio.canceled],
      ['skippedOpen', bexio.skippedOpen],
      ['otherPeriod', bexio.otherPeriod],
      ['noValidPeriod', bexio.noValidPeriod],
      ['excludedKind', bexio.excludedKind],
      ['quantityMismatch', bexio.quantityMismatch],
      ['detailFetched', bexio.detailFetched],
      ['ungeprueft', bexio.ungeprueft],
      ['contactMissing', bexio.contactMissing],
    ] as const
  ).map(([key, count]) => ({
    key: t(`printIssues.summary.bexio.${key}`),
    count,
  }));
  const graceShare = summary.rows ? summary.grace / summary.rows : 0;

  return (
    <Stack spacing={2}>
      <Typography role="status">
        {t('printIssues.summary.headline', {
          rows: t('printIssues.count.addresses', { count: summary.rows }),
          copies: t('printIssues.count.copies', { count: summary.copies }),
          date: formatDay(summary.date),
        })}
        {summary.includeUpcoming && ` · ${t('printIssues.summary.withGifts')}`}
      </Typography>

      {summary.warnings.map(warning => (
        <Alert
          key={warning}
          severity="warning"
        >
          {warning}
        </Alert>
      ))}
      {graceShare > GRACE_WARNING_SHARE && (
        <Alert severity="warning">
          {t('printIssues.summary.graceWarning')}
        </Alert>
      )}
      {!bexio.configured && (
        <Alert severity="info">
          {t('printIssues.summary.bexio.notConfigured')}
        </Alert>
      )}
      {bexio.configured && !bexio.included && (
        <Alert severity="info">
          {t('printIssues.summary.bexio.notIncluded')}
        </Alert>
      )}

      <Grid
        container
        spacing={2}
      >
        <SummaryCard title={t('printIssues.summary.sources')}>
          <CountList
            counts={[
              {
                key: t('printIssues.summary.wepublish'),
                count: summary.bySource.wepublish,
              },
              {
                key: t('printIssues.summary.bexio.title'),
                count: summary.bySource.bexio,
              },
              {
                key: t('printIssues.summary.totalSubscriptions'),
                count: summary.totalSubscriptions,
              },
            ]}
          />
        </SummaryCard>
        <SummaryCard title={t('printIssues.summary.byPlan')}>
          <CountList counts={summary.byPlan} />
        </SummaryCard>
        <SummaryCard title={t('printIssues.summary.byKind')}>
          <CountList counts={summary.byKind} />
        </SummaryCard>
        <SummaryCard title={t('printIssues.summary.hints.title')}>
          <CountList counts={hints} />
        </SummaryCard>
        <SummaryCard title={t('printIssues.summary.skipped.title')}>
          <CountList counts={reasons} />
        </SummaryCard>
        <SummaryCard title={t('printIssues.summary.byCountry')}>
          <CountList counts={summary.byCountry} />
        </SummaryCard>
        {bexio.included && (
          <SummaryCard title={t('printIssues.summary.bexio.title')}>
            <CountList counts={bexioStats} />
          </SummaryCard>
        )}
      </Grid>
    </Stack>
  );
}
