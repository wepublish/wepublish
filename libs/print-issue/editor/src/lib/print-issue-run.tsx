import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import {
  PrintIssueRowFieldsFragment,
  PrintIssueRunFieldsFragment,
  PrintIssueRunMode,
} from '@wepublish/editor/api';
import { CanCreatePrintIssue } from '@wepublish/permissions';
import { DataTable, PermissionControl } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOutput, MdPlayArrow, MdRefresh } from 'react-icons/md';
import { day, personName, time } from './common';
import { PrintIssueSummary } from './print-issue-summary';

const VIRTUALIZE_FROM = 200;

/** The computed rows, so the check is of the actual list, not only its totals. */
export function RunRowsTable({
  rows,
}: {
  rows: PrintIssueRowFieldsFragment[];
}) {
  const { t } = useTranslation();

  return (
    <DataTable
      data={rows}
      getRowId={(_row, index) => String(index)}
      // an export has ~1,300 rows; a Nachlieferung usually a handful
      virtualize={rows.length > VIRTUALIZE_FROM}
      maxHeight={480}
      emptyMessage={t('printIssues.rowsTable.empty')}
      columns={[
        {
          id: 'name',
          label: t('printIssues.rowsTable.name'),
          width: 240,
          alwaysVisible: true,
          render: row =>
            row.firma || [row.vorname, row.name].filter(Boolean).join(' '),
        },
        {
          id: 'place',
          label: t('printIssues.rowsTable.place'),
          width: 200,
          render: row => [row.plz, row.ort].filter(Boolean).join(' '),
        },
        {
          id: 'copies',
          label: t('printIssues.rowsTable.copies'),
          width: 90,
          align: 'right',
          render: row => row.anzahl,
        },
        {
          id: 'plan',
          label: t('printIssues.rowsTable.plan'),
          width: 180,
          render: row => row.aboTyp,
        },
        {
          id: 'status',
          label: t('printIssues.rowsTable.status'),
          width: 220,
          render: row => row.zahlungsstatus,
        },
        {
          id: 'hint',
          label: t('printIssues.rowsTable.hint'),
          width: 260,
          render: row => row.hinweis,
        },
      ]}
    />
  );
}

/**
 * Compute → check → export, as one flow. What is checked is exactly what is
 * exported: the API stores the computed list and exporting writes those rows
 * as a delivery. What the export does follows from the state (`mode`): the
 * first delivery, the draft written anew, or the next Nachlieferung.
 */
export function RunSteps({
  mode,
  label,
  replaces,
  run,
  computing,
  exporting,
  conflict,
  unsaved,
  onCompute,
  onExport,
}: {
  mode: PrintIssueRunMode;
  label: string;
  /** the draft delivery a `replace` run writes anew */
  replaces: { createdAt: string } | null;
  run: PrintIssueRunFieldsFragment | null;
  computing: boolean;
  exporting: boolean;
  conflict: boolean;
  /** the options have changes the stored list was not computed from */
  unsaved: boolean;
  onCompute: () => void;
  onExport: (computedAt: string) => void;
}) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [showingList, setShowingList] = useState(false);
  const supplement = mode === PrintIssueRunMode.Supplement;
  const empty = !!run && run.rows.length === 0;
  const summary = run?.summary;

  return (
    <Stack spacing={2}>
      <Stepper activeStep={run ? 1 : 0}>
        <Step>
          <StepLabel>{t('printIssues.steps.compute')}</StepLabel>
        </Step>
        <Step>
          <StepLabel>{t('printIssues.steps.check')}</StepLabel>
        </Step>
        <Step>
          <StepLabel>{t('printIssues.steps.export')}</StepLabel>
        </Step>
      </Stepper>

      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      >
        <Button
          variant={run ? 'outlined' : 'contained'}
          startIcon={run ? <MdRefresh /> : <MdPlayArrow />}
          disabled={computing || exporting}
          onClick={onCompute}
        >
          {run ? t('printIssues.recompute') : t('printIssues.compute')}
        </Button>
        {computing && (
          <Typography role="status">{t('printIssues.computing')}</Typography>
        )}
        {run && !computing && (
          <Typography color="text.secondary">
            {t('printIssues.computedLine', {
              date: day(run.computedAt),
              time: time(run.computedAt),
              name: personName(run.computedBy),
            })}
          </Typography>
        )}
      </Stack>

      {conflict && (
        <Alert severity="warning">{t('printIssues.runConflict')}</Alert>
      )}

      {run && empty && supplement && (
        <Alert severity="info">{t('printIssues.supplementEmpty')}</Alert>
      )}

      {run && !empty && summary && (
        <>
          <PrintIssueSummary summary={summary} />
          <Button
            variant="text"
            size="small"
            onClick={() => setShowingList(true)}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('printIssues.showList', { count: run.rows.length })}
          </Button>
        </>
      )}

      {!(empty && supplement) && (
        <PermissionControl qualifyingPermissions={[CanCreatePrintIssue.id]}>
          <Button
            variant="contained"
            startIcon={<MdOutput />}
            disabled={!run || computing || exporting || unsaved}
            onClick={() => setConfirming(true)}
            sx={{ alignSelf: 'flex-start' }}
          >
            {supplement ?
              t('printIssues.exportSupplement')
            : t('printIssues.export')}
          </Button>
        </PermissionControl>
      )}

      {/* every address, as an overlay like the recipient list of the communication tool */}
      <Dialog
        fullWidth
        open={showingList && !!run}
        onClose={() => setShowingList(false)}
        maxWidth="md"
      >
        <DialogTitle>{t('printIssues.runListTitle', { label })}</DialogTitle>
        <DialogContent style={{ maxHeight: '65vh' }}>
          {run && <RunRowsTable rows={run.rows} />}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setShowingList(false)}
          >
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        open={confirming}
        onClose={() => setConfirming(false)}
        maxWidth="sm"
      >
        <DialogTitle>{t(`printIssues.exportTitle.${mode}`)}</DialogTitle>
        <DialogContent>
          {t(`printIssues.exportQuestion.${mode}`, {
            addresses: summary?.rows ?? 0,
            copies: summary?.copies ?? 0,
            grace: summary?.grace ?? 0,
            gifts: summary?.gifts ?? 0,
            label,
            batch: run?.batch ?? 0,
            date: replaces ? day(replaces.createdAt) : undefined,
          })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setConfirming(false);
              if (run) {
                onExport(run.computedAt);
              }
            }}
          >
            {t(`printIssues.exportConfirm.${mode}`)}
          </Button>
          <Button
            variant="text"
            onClick={() => setConfirming(false)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
