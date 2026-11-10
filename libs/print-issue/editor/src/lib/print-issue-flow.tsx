import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
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
  PrintIssueRunFieldsFragment,
  PrintIssueRunMode,
} from '@wepublish/editor/api';
import { CanCreatePrintIssue } from '@wepublish/permissions';
import {
  PermissionControl,
  PrintExportOptionsFields,
  type PrintExportOptionsValue,
} from '@wepublish/ui/editor';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOutput, MdPlayArrow, MdRefresh, MdRestartAlt } from 'react-icons/md';
import { day, FlowKind, personName, time } from './common';
import { RunRowsTable } from './print-issue-run';
import { PrintIssueSummary } from './print-issue-summary';

/** The element that scrolls the page around `element`: its nearest scrollable ancestor, else the document. */
const scrollContainerOf = (element: HTMLElement): Element | null => {
  for (
    let parent = element.parentElement;
    parent && parent !== document.body;
    parent = parent.parentElement
  ) {
    const { overflowY } = getComputedStyle(parent);

    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
  }

  return document.scrollingElement;
};

/**
 * Optionen → Prüfen → Exportieren, below the Drucklisten. «Berechnen» saves
 * the options on the issue and computes the list; what is checked is exactly
 * what is exported: the API keeps the computed list and the export writes
 * those rows. What the export does follows from the state (`mode`): the first
 * Druckliste, the draft written anew, or the next Nachlieferung.
 */
export function PrintIssueFlow({
  kind,
  mode,
  label,
  options,
  onOptionsChange,
  defaults,
  bexioConfigured,
  run,
  replaces,
  computing,
  exporting,
  conflict,
  stale,
  earlierDrafts,
  onCompute,
  onExport,
  onCancel,
}: {
  kind: FlowKind;
  mode: PrintIssueRunMode;
  label: string;
  options: PrintExportOptionsValue;
  onOptionsChange: (options: PrintExportOptionsValue) => void;
  /** the medium's defaults, once loaded */
  defaults: PrintExportOptionsValue | null;
  bexioConfigured: boolean;
  run: PrintIssueRunFieldsFragment | null;
  /** the draft a `replace` run writes anew */
  replaces: { createdAt: string } | null;
  computing: boolean;
  exporting: boolean;
  conflict: boolean;
  /** the options changed since the list was computed */
  stale: boolean;
  /** labels of earlier issues whose draft is not delivered yet */
  earlierDrafts: string[];
  onCompute: () => void;
  onExport: (computedAt: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [showingList, setShowingList] = useState(false);
  const checkCard = useRef<HTMLDivElement>(null);
  const computedAt = run?.computedAt;

  // a fresh list: scroll to the very end of the page, past the check card and
  // the page's own padding, so the export button is in view
  useEffect(() => {
    if (computedAt && checkCard.current) {
      const container = scrollContainerOf(checkCard.current);
      container?.scrollTo?.({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [computedAt]);
  const editing = kind === 'editFirst' || kind === 'editSupplement';
  const supplement = mode === PrintIssueRunMode.Supplement;
  const summary = run?.summary;

  const steps = (
    <Stepper activeStep={run ? 1 : 0}>
      <Step>
        <StepLabel>{t('printIssues.steps.options')}</StepLabel>
      </Step>
      <Step>
        <StepLabel>{t('printIssues.steps.check')}</StepLabel>
      </Step>
      <Step>
        <StepLabel>{t('printIssues.steps.export')}</StepLabel>
      </Step>
    </Stepper>
  );

  // nobody new: nothing to check or export, the run is dropped with the flow
  if (run && supplement && run.rows.length === 0) {
    return (
      <Stack spacing={3}>
        {steps}
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={onCancel}
            >
              {t('printIssues.flow.discard')}
            </Button>
          }
        >
          {t('printIssues.supplementEmpty')}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {steps}

      <Card variant="outlined">
        <CardHeader title={t('printIssues.options.title')} />
        <CardContent>
          <Stack spacing={2}>
            <Typography color="text.secondary">
              {t('printIssues.options.intro')}
            </Typography>
            <PrintExportOptionsFields
              value={options}
              onChange={onOptionsChange}
              disabled={computing || exporting}
              bexioConfigured={bexioConfigured}
            />
            {run && stale && (
              <Alert severity="info">{t('printIssues.options.unsaved')}</Alert>
            )}
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Button
                variant="contained"
                startIcon={editing ? <MdRefresh /> : <MdPlayArrow />}
                disabled={computing || exporting}
                onClick={onCompute}
              >
                {editing ?
                  t('printIssues.recompute')
                : t('printIssues.compute')}
              </Button>
              <Button
                variant="text"
                startIcon={<MdRestartAlt />}
                disabled={!defaults || computing || exporting}
                onClick={() => defaults && onOptionsChange(defaults)}
              >
                {t('printIssues.options.reset')}
              </Button>
              <Button
                variant="text"
                disabled={computing || exporting}
                onClick={onCancel}
              >
                {t('printIssues.flow.cancel')}
              </Button>
              {computing && (
                <Typography role="status">
                  {t('printIssues.computing')}
                </Typography>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {run && (
        <Card
          ref={checkCard}
          variant="outlined"
        >
          <CardHeader title={t('printIssues.run.title')} />
          <CardContent>
            <Stack spacing={2}>
              <Typography color="text.secondary">
                {t('printIssues.computedLine', {
                  date: day(run.computedAt),
                  time: time(run.computedAt),
                  name: personName(run.computedBy),
                })}
              </Typography>

              {conflict && (
                <Alert severity="warning">{t('printIssues.runConflict')}</Alert>
              )}

              {/* a warning only: the export stays possible */}
              {earlierDrafts.length > 0 && (
                <Alert severity="warning">
                  {t('printIssues.earlierDrafts', {
                    count: earlierDrafts.length,
                    labels: earlierDrafts.join(', '),
                  })}
                </Alert>
              )}

              {summary && <PrintIssueSummary summary={summary} />}

              <Button
                variant="text"
                size="small"
                onClick={() => setShowingList(true)}
                sx={{ alignSelf: 'flex-start' }}
              >
                {t('printIssues.showList', { count: run.rows.length })}
              </Button>

              <PermissionControl
                qualifyingPermissions={[CanCreatePrintIssue.id]}
              >
                <Button
                  variant="contained"
                  startIcon={<MdOutput />}
                  disabled={computing || exporting || stale}
                  onClick={() => setConfirming(true)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {supplement ?
                    t('printIssues.exportSupplement')
                  : t('printIssues.export')}
                </Button>
              </PermissionControl>
            </Stack>
          </CardContent>
        </Card>
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
          {/* counts as plural-aware phrases: «1 Adresse», «2 Adressen» */}
          {t(`printIssues.exportQuestion.${mode}`, {
            addresses: t('printIssues.count.addresses', {
              count: summary?.rows ?? 0,
            }),
            copies: t('printIssues.count.copies', {
              count: summary?.copies ?? 0,
            }),
            grace: t('printIssues.count.grace', {
              count: summary?.grace ?? 0,
            }),
            gifts: t('printIssues.count.gifts', {
              count: summary?.gifts ?? 0,
            }),
            label,
            batch: run?.batch ?? 0,
            date: replaces ? day(replaces.createdAt) : undefined,
          })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirming(false)}
          >
            {t('cancel')}
          </Button>
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
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
