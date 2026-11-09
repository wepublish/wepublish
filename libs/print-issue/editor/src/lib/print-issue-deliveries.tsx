import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import { PrintIssueDeliveryFieldsFragment } from '@wepublish/editor/api';
import {
  CanCreatePrintIssue,
  CanDeletePrintIssue,
  CanFinalizePrintIssue,
} from '@wepublish/permissions';
import {
  DataTable,
  describePrintExportOptions,
  IconButtonTooltip,
  PermissionControl,
  printExportOptionsOf,
} from '@wepublish/ui/editor';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete, MdDownload, MdEdit, MdLockOpen } from 'react-icons/md';
import { day, personName } from './common';

type Delivery = PrintIssueDeliveryFieldsFragment;

export const deliveryName = (
  t: (key: string, values?: Record<string, unknown>) => string,
  delivery: Pick<Delivery, 'batch'>
) =>
  delivery.batch === 0 ?
    t('printIssues.deliveries.export')
  : t('printIssues.deliveries.supplement', { batch: delivery.batch });

/**
 * The Drucklisten of the issue: the Druckliste and its Nachlieferungen, each
 * with its own CSV. A draft can be edited, marked as delivered to the
 * printshop (frozen for good, counts for the quota) or deleted; the merged
 * list is always offered.
 */
export function PrintIssueDeliveries({
  issue,
  action,
  onDownload,
  onEdit,
  onDeliver,
  onDelete,
}: {
  issue: { label: string; deliveries: Delivery[] };
  /** what the issue offers next, shown below the table */
  action?: ReactNode;
  /** null: every delivery merged */
  onDownload: (deliveryId: string | null) => void;
  onEdit: (delivery: Delivery) => void;
  onDeliver: (delivery: Delivery) => void;
  onDelete: (delivery: Delivery) => void;
}) {
  const { t } = useTranslation();
  const [toDeliver, setToDeliver] = useState<Delivery | null>(null);
  const [toDelete, setToDelete] = useState<Delivery | null>(null);

  const fullListButton = (
    <Button
      variant="outlined"
      startIcon={<MdDownload />}
      disabled={issue.deliveries.length === 0}
      onClick={() => onDownload(null)}
    >
      {t('printIssues.deliveries.fullList')}
    </Button>
  );

  return (
    <Stack spacing={2}>
      <DataTable
        data={issue.deliveries}
        getRowId={delivery => delivery.id}
        emptyMessage={t('printIssues.deliveries.empty')}
        columns={[
          {
            id: 'delivery',
            label: t('printIssues.deliveries.name'),
            width: 150,
            alwaysVisible: true,
            render: delivery => deliveryName(t, delivery),
          },
          {
            id: 'exportedAt',
            label: t('printIssues.deliveries.exportedAt'),
            width: 200,
            render: delivery =>
              `${day(delivery.createdAt)} · ${personName(delivery.createdBy)}`,
          },
          {
            id: 'options',
            label: t('printIssues.deliveries.options'),
            width: 260,
            render: delivery => (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ flexWrap: 'wrap' }}
              >
                {describePrintExportOptions(
                  printExportOptionsOf(delivery.options),
                  t
                )
                  .split(' · ')
                  .map(part => (
                    <Chip
                      key={part}
                      size="small"
                      variant="outlined"
                      label={part}
                    />
                  ))}
              </Stack>
            ),
          },
          {
            id: 'rows',
            label: t('printIssues.deliveries.addresses'),
            width: 100,
            align: 'right',
            render: delivery => delivery.rowCount,
          },
          {
            id: 'copies',
            label: t('printIssues.deliveries.copies'),
            width: 100,
            align: 'right',
            render: delivery => delivery.copyCount,
          },
          {
            id: 'status',
            label: t('printIssues.deliveries.status'),
            width: 240,
            render: delivery =>
              delivery.deliveredAt ?
                t('printIssues.deliveries.deliveredLine', {
                  date: day(delivery.deliveredAt),
                  name: personName(delivery.deliveredBy),
                })
              : <Chip
                  size="small"
                  label={t('printIssues.deliveries.draft')}
                />,
          },
          {
            id: 'action',
            label: t('action'),
            width: 220,
            fixed: true,
            exportValue: false,
            // a left-aligned row keeps each action in its place however many a row has
            render: delivery => (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: 'center' }}
              >
                {/* describeChild keeps «CSV» as the button's name */}
                <IconButtonTooltip
                  caption={t('printIssues.deliveries.csvTooltip', {
                    name: deliveryName(t, delivery),
                  })}
                  describeChild
                >
                  <Button
                    size="small"
                    startIcon={<MdDownload />}
                    onClick={() => onDownload(delivery.id)}
                  >
                    {t('printIssues.deliveries.csv')}
                  </Button>
                </IconButtonTooltip>
                {!delivery.deliveredAt && (
                  <>
                    <PermissionControl
                      qualifyingPermissions={[CanCreatePrintIssue.id]}
                    >
                      <IconButtonTooltip
                        caption={t('printIssues.deliveries.editTooltip', {
                          name: deliveryName(t, delivery),
                        })}
                      >
                        <IconButton
                          aria-label={t('printIssues.deliveries.edit')}
                          size="small"
                          onClick={() => onEdit(delivery)}
                        >
                          <MdEdit />
                        </IconButton>
                      </IconButtonTooltip>
                    </PermissionControl>
                    <PermissionControl
                      qualifyingPermissions={[CanFinalizePrintIssue.id]}
                    >
                      <IconButtonTooltip
                        caption={t('printIssues.deliveries.deliverTooltip', {
                          name: deliveryName(t, delivery),
                        })}
                      >
                        <IconButton
                          aria-label={t('printIssues.deliveries.deliver')}
                          size="small"
                          onClick={() => setToDeliver(delivery)}
                        >
                          {/* a draft is still open; delivered rows show their date instead */}
                          <MdLockOpen />
                        </IconButton>
                      </IconButtonTooltip>
                    </PermissionControl>
                    <PermissionControl
                      qualifyingPermissions={[CanDeletePrintIssue.id]}
                    >
                      <IconButtonTooltip
                        caption={t('printIssues.deliveries.delete')}
                      >
                        <IconButton
                          aria-label={t('printIssues.deliveries.delete')}
                          size="small"
                          color="error"
                          onClick={() => setToDelete(delivery)}
                        >
                          <MdDelete />
                        </IconButton>
                      </IconButtonTooltip>
                    </PermissionControl>
                  </>
                )}
              </Stack>
            ),
          },
        ]}
      />

      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      >
        {action}
        {/* the hint explains what is downloaded: only once there is something */}
        {issue.deliveries.length > 0 ?
          <Tooltip
            title={t('printIssues.deliveries.fullListHint')}
            placement="right"
            describeChild
          >
            {fullListButton}
          </Tooltip>
        : fullListButton}
      </Stack>

      <Dialog
        fullWidth
        open={!!toDeliver}
        onClose={() => setToDeliver(null)}
        maxWidth="sm"
      >
        <DialogTitle>{t('printIssues.deliveries.deliverTitle')}</DialogTitle>
        <DialogContent>
          {toDeliver &&
            t('printIssues.deliveries.deliverQuestion', {
              name: deliveryName(t, toDeliver),
              label: issue.label,
            })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setToDeliver(null)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (toDeliver) {
                onDeliver(toDeliver);
              }
              setToDeliver(null);
            }}
          >
            {t('printIssues.deliveries.deliverConfirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        maxWidth="sm"
      >
        <DialogTitle>{t('printIssues.deliveries.deleteTitle')}</DialogTitle>
        <DialogContent>
          {toDelete &&
            t('printIssues.deliveries.deleteQuestion', {
              name: deliveryName(t, toDelete),
            })}
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
                onDelete(toDelete);
              }
              setToDelete(null);
            }}
          >
            {t('printIssues.deliveries.deleteConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
