import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import {
  ClosePrintIssueDocument,
  DeletePrintIssueDocument,
  DuplicatePrintIssueDocument,
  PrintIssuesDocument,
  PrintIssueStatus,
  ReopenPrintIssueDocument,
  TinyPrintIssueFragment,
} from '@wepublish/editor/api';
import {
  CanCreatePrintIssue,
  CanDeletePrintIssue,
  CanFinalizePrintIssue,
  CanGetPrintIssues,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  IconButtonTooltip,
  Link,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdContentCopy,
  MdDelete,
  MdLock,
  MdLockOpen,
} from 'react-icons/md';
import {
  Link as RouterLink,
  useMatch,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  allDelivered,
  anyDelivered,
  day,
  formatDay,
  MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE,
  nextIssue,
  personName,
  PRINT_ISSUES_PATH,
  printIssueCreatePath,
  printIssueEditPath,
  printIssueListPath,
  showErrors,
} from './common';
import { PrintIssueDrawer } from './print-issue-drawer';
import { PrintIssueStatusChip } from './print-issue-status';
import { PrintListIcon } from './print-list-icon';

const copiesOf = (issue: TinyPrintIssueFragment) =>
  issue.deliveries.reduce((sum, delivery) => sum + delivery.copyCount, 0);

function PrintIssueList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const creating = !!useMatch(printIssueCreatePath());
  const [toDelete, setToDelete] = useState<TinyPrintIssueFragment | null>(null);
  const [toClose, setToClose] = useState<TinyPrintIssueFragment | null>(null);

  const { data, error, loading } = useQuery(PrintIssuesDocument);
  const issues = data?.printIssues ?? [];

  useEffect(() => {
    if (error) {
      showErrors(error);
    }
  }, [error]);

  const refetchList = { refetchQueries: ['PrintIssues'] };
  const [deleteIssue] = useMutation(DeletePrintIssueDocument, {
    ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('toast.deletedSuccess')),
    ...refetchList,
  });
  const [closeIssue] = useMutation(ClosePrintIssueDocument, {
    ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('printIssues.closed')),
    ...refetchList,
  });
  const [reopenIssue] = useMutation(ReopenPrintIssueDocument, {
    ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('printIssues.reopened')),
    ...refetchList,
  });
  const [duplicateIssue] = useMutation(DuplicatePrintIssueDocument, {
    ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('printIssues.duplicated')),
    ...refetchList,
  });

  const duplicate = async (issue: TinyPrintIssueFragment) => {
    const result = await duplicateIssue({ variables: { id: issue.id } });
    const copy = result.data?.duplicatePrintIssue;

    // the copy keeps the ship day of the original: the form is the next stop
    if (copy) {
      navigate(printIssueEditPath(copy.id));
    }
  };

  const closeDrawer = () => navigate(PRINT_ISSUES_PATH);
  const editing =
    editId ? (issues.find(issue => issue.id === editId) ?? null) : null;

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('printIssues.title')}</h2>
          <Typography
            component="p"
            sx={{ color: 'text.secondary', maxWidth: 720 }}
          >
            {t('printIssues.intro')}
          </Typography>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreatePrintIssue.id]}>
          <RouterLink to={printIssueCreatePath()}>
            <Button
              variant="contained"
              startIcon={<MdAdd />}
            >
              {t('printIssues.create')}
            </Button>
          </RouterLink>
        </PermissionControl>
      </ListViewContainer>

      <DataTable
        storageKey="print-issues"
        data={issues}
        loading={loading}
        getRowId={issue => issue.id}
        emptyMessage={t('printIssues.noIssues')}
        columns={[
          {
            id: 'issue',
            label: t('printIssues.fields.issue'),
            width: 110,
            alwaysVisible: true,
            render: issue => (
              <Link to={printIssueEditPath(issue.id)}>{issue.label}</Link>
            ),
            exportValue: issue => issue.label,
          },
          {
            id: 'issueDate',
            label: t('printIssues.fields.issueDate'),
            width: 150,
            render: issue => formatDay(issue.issueDate),
          },
          {
            id: 'status',
            label: t('printIssues.fields.status'),
            width: 150,
            render: issue => <PrintIssueStatusChip issue={issue} />,
            exportValue: issue => t(`printIssues.status.${issue.status}`),
          },
          {
            id: 'deliveries',
            label: t('printIssues.fields.deliveries'),
            width: 170,
            render: issue =>
              issue.deliveries.length ?
                t('printIssues.deliveriesCell', {
                  count: issue.deliveries.length,
                  delivered: issue.deliveries.filter(
                    delivery => delivery.deliveredAt
                  ).length,
                })
              : '',
          },
          {
            id: 'copies',
            label: t('printIssues.fields.copies'),
            width: 110,
            align: 'right',
            render: issue => (issue.deliveries.length ? copiesOf(issue) : ''),
          },
          {
            id: 'closedAt',
            label: t('printIssues.fields.closedAt'),
            width: 220,
            render: issue =>
              issue.closedAt ?
                t('printIssues.closedLine', {
                  date: day(issue.closedAt),
                  name: personName(issue.closedBy),
                })
              : '',
          },
          {
            id: 'action',
            label: t('action'),
            width: 190,
            align: 'center',
            fixed: true,
            exportValue: false,
            render: issue => {
              const historic = issue.status === PrintIssueStatus.Historic;
              const closed = issue.status === PrintIssueStatus.Closed;

              return (
                <>
                  <IconButtonTooltip caption={t('printIssues.actions.list')}>
                    {historic ?
                      <IconButton
                        aria-label={t('printIssues.actions.list')}
                        size="small"
                        disabled
                      >
                        <PrintListIcon disabled />
                      </IconButton>
                    : <IconButton
                        component={RouterLink}
                        to={printIssueListPath(issue.id)}
                        aria-label={t('printIssues.actions.list')}
                        size="small"
                      >
                        <PrintListIcon />
                      </IconButton>
                    }
                  </IconButtonTooltip>
                  <PermissionControl
                    qualifyingPermissions={[CanCreatePrintIssue.id]}
                  >
                    <IconButtonTooltip
                      caption={t('printIssues.actions.duplicate')}
                    >
                      <IconButton
                        aria-label={t('printIssues.actions.duplicate')}
                        size="small"
                        disabled={historic}
                        onClick={() => duplicate(issue)}
                      >
                        <MdContentCopy />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={[CanFinalizePrintIssue.id]}
                  >
                    {/* the lock shows the state, the tooltip names the action; a historic issue is frozen for good */}
                    {historic ?
                      <IconButtonTooltip
                        caption={t('printIssues.actions.historic')}
                      >
                        <IconButton
                          aria-label={t('printIssues.actions.historic')}
                          size="small"
                          disabled
                        >
                          <MdLock />
                        </IconButton>
                      </IconButtonTooltip>
                    : closed ?
                      <IconButtonTooltip
                        caption={t('printIssues.actions.reopen')}
                      >
                        <IconButton
                          aria-label={t('printIssues.actions.reopen')}
                          size="small"
                          onClick={() =>
                            reopenIssue({ variables: { id: issue.id } })
                          }
                        >
                          <MdLock />
                        </IconButton>
                      </IconButtonTooltip>
                    : <IconButtonTooltip
                        caption={t('printIssues.actions.close')}
                      >
                        <IconButton
                          aria-label={t('printIssues.actions.close')}
                          size="small"
                          disabled={!allDelivered(issue.deliveries)}
                          onClick={() => setToClose(issue)}
                        >
                          <MdLockOpen />
                        </IconButton>
                      </IconButtonTooltip>
                    }
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={[CanDeletePrintIssue.id]}
                  >
                    <IconButtonTooltip
                      caption={t('printIssues.actions.delete')}
                    >
                      <IconButton
                        aria-label={t('printIssues.actions.delete')}
                        color="error"
                        size="small"
                        disabled={anyDelivered(issue.deliveries)}
                        onClick={() => setToDelete(issue)}
                      >
                        <MdDelete />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                </>
              );
            },
          },
        ]}
      />

      <PrintIssueDrawer
        open={creating || !!editId}
        issue={creating ? null : editing}
        next={nextIssue(issues)}
        onClose={closeDrawer}
      />

      <Dialog
        fullWidth
        open={!!toClose}
        onClose={() => setToClose(null)}
        maxWidth="sm"
      >
        <DialogTitle>{t('printIssues.closeTitle')}</DialogTitle>
        <DialogContent>
          {t('printIssues.closeQuestion', { label: toClose?.label })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              if (toClose) {
                closeIssue({ variables: { id: toClose.id } });
              }
              setToClose(null);
            }}
          >
            {t('printIssues.closeConfirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setToClose(null)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        maxWidth="sm"
      >
        <DialogTitle>{t('printIssues.deleteTitle')}</DialogTitle>
        <DialogContent>
          {t('printIssues.deleteQuestion', { label: toDelete?.label })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (toDelete) {
                deleteIssue({ variables: { id: toDelete.id } });
              }
              setToDelete(null);
            }}
          >
            {t('printIssues.deleteConfirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setToDelete(null)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPrintIssues.id,
])(PrintIssueList);
export { CheckedPermissionComponent as PrintIssueList };
