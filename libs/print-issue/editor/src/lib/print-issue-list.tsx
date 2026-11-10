import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
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
import { ReactElement, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { BiSpreadsheet } from 'react-icons/bi';
import {
  MdAdd,
  MdContentCopy,
  MdDelete,
  MdLocalShipping,
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
  newestDelivery,
  nextIssue,
  personName,
  PRINT_ISSUES_PATH,
  printIssueCreatePath,
  printIssueEditPath,
  printIssueListPath,
  showErrors,
} from './common';
import { deliveryName } from './print-issue-deliveries';
import { PrintIssueDrawer } from './print-issue-drawer';
import { PrintIssueStatusChip } from './print-issue-status';
import { PrintListIcon } from './print-list-icon';

const copiesOf = (issue: TinyPrintIssueFragment) =>
  issue.deliveries.reduce((sum, delivery) => sum + delivery.copyCount, 0);

/**
 * A tooltip that also explains a disabled action: a disabled button gets no
 * pointer events, so the tooltip listens on a wrapper around it. The button
 * keeps its action name; the reason is its description.
 */
function ReasonTooltip({
  reason,
  children,
}: {
  reason: string;
  children: ReactElement;
}) {
  return (
    <IconButtonTooltip
      caption={reason}
      describeChild
    >
      {/* aligned like the unwrapped icon buttons beside it */}
      <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
        {children}
      </span>
    </IconButtonTooltip>
  );
}

const deliveredOf = (issue: TinyPrintIssueFragment) =>
  issue.deliveries.filter(delivery => delivery.deliveredAt).length;

// a smaller glyph with more room than the chip's default 18px at 4px
const PAIR_CHIP_SX = { '& .MuiChip-icon': { fontSize: 15, ml: 0.75 } };

/** The Drucklisten of an issue as outlined icon + number chips; the tooltips say what each number means. */
function DeliveriesCell({ issue }: { issue: TinyPrintIssueFragment }) {
  const { t } = useTranslation();
  const count = issue.deliveries.length;
  // a Nachlieferung exists only once the Druckliste (batch 0) is delivered
  const supplements = count - 1;
  const delivered = deliveredOf(issue);
  // only the newest list can be a draft; until delivered it counts for no quota
  const draft = issue.deliveries.find(delivery => !delivery.deliveredAt);
  const deliveredCaption =
    delivered ?
      t('printIssues.listCell.delivered', { delivered, count })
    : t('printIssues.listCell.deliveredNone');

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: 'center' }}
    >
      <IconButtonTooltip
        caption={
          supplements > 0 ?
            t('printIssues.listCell.listsWithSupplements', {
              count: supplements,
            })
          : t('printIssues.listCell.lists')
        }
      >
        <Chip
          size="small"
          variant="outlined"
          icon={<BiSpreadsheet />}
          label={count}
          sx={PAIR_CHIP_SX}
        />
      </IconButtonTooltip>
      <IconButtonTooltip
        caption={
          draft ?
            `${deliveredCaption} ${t('printIssues.listCell.draftHint', {
              name: deliveryName(t, draft),
            })}`
          : deliveredCaption
        }
      >
        <Chip
          size="small"
          variant="outlined"
          color={draft ? 'warning' : 'default'}
          icon={<MdLocalShipping />}
          label={delivered}
          sx={PAIR_CHIP_SX}
        />
      </IconButtonTooltip>
    </Stack>
  );
}

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
          {/* the intro goes below the heading, not beside it */}
          <Stack spacing={0.5}>
            <h2>{t('printIssues.title')}</h2>
            <Typography
              component="p"
              sx={{ color: 'text.secondary', maxWidth: 720 }}
            >
              {/* the intro may use <strong>, <em>, <i> and <br/> */}
              <Trans
                i18nKey="printIssues.intro"
                components={{
                  strong: <strong />,
                  em: <em />,
                  i: <i />,
                  br: <br />,
                }}
              />
            </Typography>
          </Stack>
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
            id: 'image',
            label: t('printIssues.fields.image'),
            width: 64,
            exportValue: false,
            // decorative: the issue label next to it names the row
            render: issue =>
              issue.image?.squareURL ?
                <img
                  src={issue.image.squareURL}
                  alt=""
                  width={40}
                  height={40}
                  style={{
                    display: 'block',
                    objectFit: 'cover',
                    borderRadius: 4,
                  }}
                />
              : null,
          },
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
            id: 'title',
            label: t('printIssues.fields.title'),
            width: 260,
            defaultHidden: true,
            render: issue => issue.title ?? '',
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
              issue.deliveries.length ? <DeliveriesCell issue={issue} /> : '',
            exportValue: issue =>
              issue.deliveries.length ?
                t('printIssues.deliveriesCell', {
                  count: issue.deliveries.length,
                  delivered: deliveredOf(issue),
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
              const newest = newestDelivery(issue.deliveries);
              const lockReason =
                historic ? t('printIssues.lockReason.historic')
                : closed ? t('printIssues.lockReason.reopen')
                : !newest ? t('printIssues.lockReason.noLists')
                : !newest.deliveredAt ?
                  t('printIssues.lockReason.draft', {
                    name: deliveryName(t, newest),
                  })
                : t('printIssues.lockReason.close');
              const deleteReason =
                anyDelivered(issue.deliveries) ?
                  t('printIssues.deleteReason.delivered')
                : historic ? t('printIssues.deleteReason.historic')
                : issue.deliveries.length ? t('printIssues.deleteReason.draft')
                : t('printIssues.deleteReason.empty');

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
                      <ReasonTooltip reason={lockReason}>
                        <IconButton
                          aria-label={t('printIssues.actions.historic')}
                          size="small"
                          disabled
                        >
                          <MdLock />
                        </IconButton>
                      </ReasonTooltip>
                    : closed ?
                      <ReasonTooltip reason={lockReason}>
                        <IconButton
                          aria-label={t('printIssues.actions.reopen')}
                          size="small"
                          onClick={() =>
                            reopenIssue({ variables: { id: issue.id } })
                          }
                        >
                          <MdLock />
                        </IconButton>
                      </ReasonTooltip>
                    : <ReasonTooltip reason={lockReason}>
                        <IconButton
                          aria-label={t('printIssues.actions.close')}
                          size="small"
                          disabled={!allDelivered(issue.deliveries)}
                          onClick={() => setToClose(issue)}
                        >
                          <MdLockOpen />
                        </IconButton>
                      </ReasonTooltip>
                    }
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={[CanDeletePrintIssue.id]}
                  >
                    <ReasonTooltip reason={deleteReason}>
                      <IconButton
                        aria-label={t('printIssues.actions.delete')}
                        color="error"
                        size="small"
                        disabled={anyDelivered(issue.deliveries)}
                        onClick={() => setToDelete(issue)}
                      >
                        <MdDelete />
                      </IconButton>
                    </ReasonTooltip>
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
            variant="text"
            onClick={() => setToClose(null)}
          >
            {t('cancel')}
          </Button>
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
            variant="text"
            onClick={() => setToDelete(null)}
          >
            {t('cancel')}
          </Button>
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
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPrintIssues.id,
])(PrintIssueList);
export { CheckedPermissionComponent as PrintIssueList };
