import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
} from '@mui/material';
import {
  ComputePrintIssueRunDocument,
  DeletePrintIssueDeliveryDocument,
  DeliverPrintIssueDeliveryDocument,
  ExportPrintIssueRunDocument,
  PrintExportContextDocument,
  PrintIssueByIdDocument,
  PrintIssueCsvDocument,
  PrintIssueRunDocument,
  PrintIssueRunMode,
  UpdatePrintIssueDocument,
} from '@wepublish/editor/api';
import { CanGetPrintIssues } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  ListViewContainer,
  ListViewHeader,
  PrintExportOptionsFields,
  printExportOptionsOf,
  samePrintExportOptions,
  type PrintExportOptionsValue,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowBack, MdRestartAlt, MdSave } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import {
  formatDay,
  issueState,
  MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE,
  nextRunMode,
  PRINT_ISSUES_PATH,
  showErrors,
} from './common';
import { downloadCsv } from './download-csv';
import { PrintIssueDeliveries } from './print-issue-deliveries';
import { RunSteps } from './print-issue-run';
import { PrintIssueStatusChip } from './print-issue-status';

const EXPORTED_MESSAGE: Record<PrintIssueRunMode, string> = {
  [PrintIssueRunMode.Export]: 'printIssues.exported',
  [PrintIssueRunMode.Replace]: 'printIssues.exportedReplaced',
  [PrintIssueRunMode.Supplement]: 'printIssues.exportedSupplement',
};

/** «Druckliste Ausgabe 1.27»: options, compute → check → export, and the deliveries. */
function PrintIssueListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [conflict, setConflict] = useState(false);
  // the options as edited here; null while they equal the saved ones
  const [edited, setEdited] = useState<PrintExportOptionsValue | null>(null);

  const { data } = useQuery(PrintIssueByIdDocument, { variables: { id } });
  const issue = data?.printIssue;
  const { data: contextData } = useQuery(PrintExportContextDocument);
  const exportContext = contextData?.printExportContext;

  const state = issue ? issueState(issue) : null;
  const historic = state === 'historic';
  const closed = state === 'closed';
  const editable = state === 'open' || state === 'exported';

  // The computed list waiting to be checked; what is exported is exactly this.
  const { data: runData } = useQuery(PrintIssueRunDocument, {
    variables: { id },
    skip: !issue || historic,
    fetchPolicy: 'network-only',
  });
  const run = runData?.printIssueRun ?? null;
  const mode =
    run?.mode ?? (issue ? nextRunMode(issue) : PrintIssueRunMode.Export);
  const replaces =
    run?.mode === PrintIssueRunMode.Replace ?
      (issue?.deliveries.find(delivery => delivery.id === run.deliveryId) ??
      null)
    : null;

  const saved = printExportOptionsOf(issue?.options);
  const options = edited ?? saved;
  const optionsDirty =
    edited !== null && !samePrintExportOptions(edited, saved);

  const [updateIssue, { loading: saving }] = useMutation(
    UpdatePrintIssueDocument,
    {
      ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('printIssues.optionsSaved')),
      refetchQueries: ['PrintIssueById', 'PrintIssueRun'],
    }
  );
  const [computeRun, { loading: computing }] = useMutation(
    ComputePrintIssueRunDocument,
    {
      refetchQueries: ['PrintIssueRun'],
    }
  );
  // a refused export is handled where it is called: it asks to compute again
  const [exportRun, { loading: exporting }] = useMutation(
    ExportPrintIssueRunDocument,
    {
      refetchQueries: ['PrintIssueById', 'PrintIssueRun', 'PrintIssues'],
    }
  );
  const refetchIssue = {
    refetchQueries: ['PrintIssueById', 'PrintIssueRun', 'PrintIssues'],
  };
  const [deliverDelivery] = useMutation(DeliverPrintIssueDeliveryDocument, {
    ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('printIssues.delivered')),
    ...refetchIssue,
  });
  const [deleteDelivery] = useMutation(DeletePrintIssueDeliveryDocument, {
    ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('printIssues.deliveryDeleted')),
    ...refetchIssue,
  });
  // Apollo Client 4: lazy queries take no onCompleted/onError; the trigger
  // resolves with the result and rejects on an error.
  const [fetchCsv] = useLazyQuery(PrintIssueCsvDocument, {
    fetchPolicy: 'network-only',
  });

  const download = async (deliveryId: string | null) => {
    try {
      const { data: file } = await fetchCsv({ variables: { id, deliveryId } });

      if (file) {
        downloadCsv(file.printIssueCsv.csv, file.printIssueCsv.filename);
      }
    } catch (error) {
      showErrors(error as Error);
    }
  };

  const saveOptions = async () => {
    if (!issue) {
      return;
    }

    const result = await updateIssue({
      variables: {
        id,
        input: {
          number: issue.number,
          year: issue.year,
          issueDate: issue.issueDate,
          note: issue.note ?? null,
          historic: false,
          options,
        },
      },
    });

    if (result.data) {
      setEdited(null);
    }
  };

  const compute = async () => {
    setConflict(false);

    // the list is computed from the saved options: save what was changed first
    if (optionsDirty) {
      await saveOptions();
    }

    try {
      await computeRun({ variables: { id } });
    } catch (error) {
      showErrors(error as Error);
    }
  };

  const doExport = async (computedAt: string) => {
    try {
      await exportRun({ variables: { id, computedAt } });
    } catch (error) {
      setConflict(true);
      showErrors(error as Error);
      return;
    }

    enqueueSnackbar(t(EXPORTED_MESSAGE[mode]), { variant: 'success' });
  };

  if (!issue) {
    return null;
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center' }}
          >
            <h2>{t('printIssues.listView.title', { label: issue.label })}</h2>
            <PrintIssueStatusChip issue={issue} />
          </Stack>
          <Typography
            component="p"
            sx={{ color: 'text.secondary' }}
          >
            {t('printIssues.listView.shipDay', {
              date: formatDay(issue.issueDate),
            })}
          </Typography>
        </ListViewHeader>
        <Button
          variant="text"
          startIcon={<MdArrowBack />}
          onClick={() => navigate(PRINT_ISSUES_PATH)}
        >
          {t('printIssues.listView.back')}
        </Button>
      </ListViewContainer>

      <Stack
        spacing={3}
        sx={{ mt: 3, maxWidth: 1100 }}
      >
        {historic && (
          <Alert severity="info">{t('printIssues.historicNoExport')}</Alert>
        )}

        {!historic && (
          <Card variant="outlined">
            <CardHeader title={t('printIssues.options.title')} />
            <CardContent>
              <Stack spacing={2}>
                <Typography color="text.secondary">
                  {t('printIssues.options.intro')}
                </Typography>
                <PrintExportOptionsFields
                  value={options}
                  onChange={setEdited}
                  disabled={!editable}
                  bexioConfigured={exportContext?.bexioConfigured ?? true}
                />
                {optionsDirty && (
                  <Alert severity="info">
                    {t('printIssues.options.unsaved')}
                  </Alert>
                )}
                <Stack
                  direction="row"
                  spacing={1}
                >
                  <Button
                    variant="contained"
                    startIcon={<MdSave />}
                    disabled={!optionsDirty || saving}
                    onClick={saveOptions}
                  >
                    {t('printIssues.options.save')}
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<MdRestartAlt />}
                    disabled={!editable || !exportContext}
                    onClick={() =>
                      exportContext &&
                      setEdited(printExportOptionsOf(exportContext.defaults))
                    }
                  >
                    {t('printIssues.options.reset')}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        {!historic && (
          <Card variant="outlined">
            <CardHeader title={t('printIssues.run.title')} />
            <CardContent>
              {closed ?
                <Alert severity="info">{t('printIssues.closedInfo')}</Alert>
              : <Stack spacing={2}>
                  <Typography color="text.secondary">
                    {t('printIssues.run.intro', {
                      date: formatDay(issue.issueDate),
                    })}
                  </Typography>
                  <RunSteps
                    mode={mode}
                    label={issue.label}
                    replaces={replaces}
                    run={run}
                    computing={computing}
                    exporting={exporting}
                    conflict={conflict}
                    unsaved={optionsDirty}
                    onCompute={compute}
                    onExport={doExport}
                  />
                </Stack>
              }
            </CardContent>
          </Card>
        )}

        {!historic && (
          <Card variant="outlined">
            <CardHeader title={t('printIssues.deliveries.title')} />
            <CardContent>
              <PrintIssueDeliveries
                issue={issue}
                onDownload={download}
                onDeliver={delivery =>
                  deliverDelivery({ variables: { id: delivery.id } })
                }
                onDelete={delivery =>
                  deleteDelivery({ variables: { id: delivery.id } })
                }
              />
            </CardContent>
          </Card>
        )}
      </Stack>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPrintIssues.id,
])(PrintIssueListView);
export { CheckedPermissionComponent as PrintIssueListView };
