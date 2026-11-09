import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  Box,
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
  PrintIssueDeliveryFieldsFragment,
  PrintIssueRunFieldsFragment,
  PrintIssueRunMode,
  UpdatePrintIssueDocument,
} from '@wepublish/editor/api';
import { CanCreatePrintIssue, CanGetPrintIssues } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  printExportOptionsOf,
  samePrintExportOptions,
  type PrintExportOptionsValue,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdArrowBack, MdEdit } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FlowKind,
  flowKind,
  formatDay,
  issueState,
  MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE,
  newestDelivery,
  nextRunMode,
  PRINT_ISSUES_PATH,
  showErrors,
} from './common';
import { downloadCsv } from './download-csv';
import { PrintIssueDeliveries } from './print-issue-deliveries';
import { PrintIssueFlow } from './print-issue-flow';
import { PrintIssueStatusChip } from './print-issue-status';

const EXPORTED_MESSAGE: Record<PrintIssueRunMode, string> = {
  [PrintIssueRunMode.Export]: 'printIssues.exported',
  [PrintIssueRunMode.Replace]: 'printIssues.exportedReplaced',
  [PrintIssueRunMode.Supplement]: 'printIssues.exportedSupplement',
};

type Delivery = PrintIssueDeliveryFieldsFragment;

/** The flow below the table, while it is open. */
type Flow = {
  kind: FlowKind;
  /** the draft being edited; none when a list is added */
  delivery: Delivery | null;
  options: PrintExportOptionsValue;
  /** the computed list waiting to be checked, and the options it came from */
  run: PrintIssueRunFieldsFragment | null;
  computedWith: PrintExportOptionsValue | null;
  conflict: boolean;
};

/**
 * «Drucklisten Ausgabe 1.27»: the Drucklisten first, then what the issue
 * offers next (the first Druckliste, editing the draft, or a Nachlieferung)
 * as a flow of options → check → export. The API's stored run is only the
 * handshake between check and export: a reload starts at the table again.
 */
function PrintIssueListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [flow, setFlow] = useState<Flow | null>(null);

  const { data } = useQuery(PrintIssueByIdDocument, { variables: { id } });
  const issue = data?.printIssue;
  const { data: contextData } = useQuery(PrintExportContextDocument);
  const exportContext = contextData?.printExportContext;

  const state = issue ? issueState(issue) : null;
  const historic = state === 'historic';
  const closed = state === 'closed';
  const kind = issue ? flowKind(issue) : null;

  const mode =
    flow?.run?.mode ?? (issue ? nextRunMode(issue) : PrintIssueRunMode.Export);
  const replaces =
    flow?.run?.mode === PrintIssueRunMode.Replace ?
      (issue?.deliveries.find(
        delivery => delivery.id === flow.run?.deliveryId
      ) ?? null)
    : null;
  const stale =
    !!flow?.run &&
    !!flow.computedWith &&
    !samePrintExportOptions(flow.options, flow.computedWith);

  const [updateIssue] = useMutation(UpdatePrintIssueDocument, {
    onError: showErrors,
    refetchQueries: ['PrintIssueById'],
  });
  const [computeRun, { loading: computing }] = useMutation(
    ComputePrintIssueRunDocument
  );
  // a refused export is handled where it is called: it asks to compute again
  const [exportRun, { loading: exporting }] = useMutation(
    ExportPrintIssueRunDocument,
    { refetchQueries: ['PrintIssueById', 'PrintIssues'] }
  );
  const refetchIssue = { refetchQueries: ['PrintIssueById', 'PrintIssues'] };
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

  // The options start from the draft being edited, else from the newest
  // list, else from the issue (seeded with the medium's defaults).
  const openFlow = (next: FlowKind, delivery: Delivery | null = null) => {
    if (!issue) {
      return;
    }

    const editing = next === 'editFirst' || next === 'editSupplement';
    const newest = newestDelivery(issue.deliveries);
    const draft = editing ? (delivery ?? newest) : null;

    setFlow({
      kind: next,
      delivery: draft,
      options: printExportOptionsOf(
        draft?.options ?? newest?.options ?? issue.options
      ),
      run: null,
      computedWith: null,
      conflict: false,
    });
  };

  const setOptions = (options: PrintExportOptionsValue) =>
    setFlow(current => current && { ...current, options });

  // the list is computed from the issue's options: store the flow's first
  const compute = async () => {
    if (!issue || !flow) {
      return;
    }

    setFlow(current => current && { ...current, conflict: false });

    if (
      !samePrintExportOptions(flow.options, printExportOptionsOf(issue.options))
    ) {
      const saved = await updateIssue({
        variables: {
          id,
          input: {
            number: issue.number,
            year: issue.year,
            issueDate: issue.issueDate,
            note: issue.note ?? null,
            historic: false,
            options: flow.options,
          },
        },
      });

      // with onError set, a refused mutation resolves without data
      if (!saved.data) {
        return;
      }
    }

    try {
      const result = await computeRun({ variables: { id } });
      const run = result.data?.computePrintIssueRun ?? null;

      setFlow(
        current =>
          current && {
            ...current,
            run,
            computedWith: current.options,
            conflict: false,
          }
      );
    } catch (error) {
      showErrors(error as Error);
    }
  };

  const doExport = async (computedAt: string) => {
    try {
      await exportRun({ variables: { id, computedAt } });
    } catch (error) {
      setFlow(current => current && { ...current, conflict: true });
      showErrors(error as Error);
      return;
    }

    enqueueSnackbar(t(EXPORTED_MESSAGE[mode]), { variant: 'success' });
    setFlow(null);
  };

  if (!issue) {
    return null;
  }

  const flowButton =
    kind && !flow ?
      <PermissionControl qualifyingPermissions={[CanCreatePrintIssue.id]}>
        <Button
          variant="contained"
          startIcon={
            kind === 'editFirst' || kind === 'editSupplement' ?
              <MdEdit />
            : <MdAdd />
          }
          onClick={() => openFlow(kind)}
        >
          {t(`printIssues.flow.${kind}`)}
        </Button>
      </PermissionControl>
    : null;

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
        sx={{ mt: 3 }}
      >
        {historic && (
          <Alert severity="info">{t('printIssues.historicNoExport')}</Alert>
        )}

        {closed && <Alert severity="info">{t('printIssues.closedInfo')}</Alert>}

        {!historic && (
          <Card variant="outlined">
            <CardHeader title={t('printIssues.listView.section')} />
            <CardContent>
              <PrintIssueDeliveries
                issue={issue}
                action={flowButton}
                onDownload={download}
                onEdit={delivery =>
                  openFlow(
                    delivery.batch === 0 ? 'editFirst' : 'editSupplement',
                    delivery
                  )
                }
                onDeliver={delivery => {
                  setFlow(null);
                  deliverDelivery({ variables: { id: delivery.id } });
                }}
                onDelete={delivery => {
                  setFlow(null);
                  deleteDelivery({ variables: { id: delivery.id } });
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* the table takes the width it gets; the flow stays readable */}
        {flow && (
          <Box sx={{ maxWidth: 1100 }}>
            <PrintIssueFlow
              key={`${flow.kind}-${flow.delivery?.id ?? 'new'}`}
              kind={flow.kind}
              mode={mode}
              label={issue.label}
              options={flow.options}
              onOptionsChange={setOptions}
              defaults={
                exportContext ?
                  printExportOptionsOf(exportContext.defaults)
                : null
              }
              bexioConfigured={exportContext?.bexioConfigured ?? true}
              run={flow.run}
              replaces={replaces}
              computing={computing}
              exporting={exporting}
              conflict={flow.conflict}
              stale={stale}
              onCompute={compute}
              onExport={doExport}
              onCancel={() => setFlow(null)}
            />
          </Box>
        )}
      </Stack>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPrintIssues.id,
])(PrintIssueListView);
export { CheckedPermissionComponent as PrintIssueListView };
