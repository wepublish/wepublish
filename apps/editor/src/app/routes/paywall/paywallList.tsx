import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  DeletePaywallDocument,
  FullPaywallFragment,
  PaywallListDocument,
} from '@wepublish/editor/api';
import {
  CanCreatePaywall,
  CanDeletePaywall,
  CanUpdatePaywall,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  IconButton,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

const { Column, HeaderCell, Cell: RCell } = RTable;

function PaywallList() {
  const { t } = useTranslation();
  const [paywallToDelete, setPaywallToDelete] = useState<
    FullPaywallFragment | undefined
  >(undefined);

  const { data, loading, refetch } = useQuery(PaywallListDocument, {});
  const [deletePaywall] = useMutation(DeletePaywallDocument, {
    onCompleted() {
      refetch();
    },
  });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('paywall.overview.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <Button
              variant="contained"
              loading={false}
              startIcon={<MdAdd />}
            >
              {t('paywall.overview.createPaywall')}
            </Button>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.paywalls ?? []}
        >
          <Column
            width={75}
            resizable
          >
            <HeaderCell>{t('paywall.overview.active')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<FullPaywallFragment>) =>
                rowData.active ? `✅` : `❌`
              }
            </RCell>
          </Column>

          <Column
            width={300}
            resizable
          >
            <HeaderCell>{t('paywall.overview.name')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<FullPaywallFragment>) => (
                <Link to={`edit/${rowData.id}`}>{rowData.name}</Link>
              )}
            </RCell>
          </Column>

          <Column
            width={500}
            resizable
          >
            <HeaderCell>{t('paywall.overview.memberPlans')}</HeaderCell>

            <RCell>
              {(rowData: FullPaywallFragment) =>
                rowData.anyMemberPlan ?
                  t('paywall.overview.anyMemberPlan')
                : rowData.memberPlans.map((mb, index) => (
                    <Fragment key={mb.id}>
                      <Link to={`/memberplans/edit/${mb.id}`}>{mb.name}</Link>

                      {!!rowData.memberPlans.at(index + 1) && <>, </>}
                    </Fragment>
                  ))
              }
            </RCell>
          </Column>

          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(paywall: RowDataType<FullPaywallFragment>) => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    color="error"
                    size="small"
                    aria-label={t('delete')}
                    onClick={() =>
                      setPaywallToDelete(paywall as FullPaywallFragment)
                    }
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <Dialog
        fullWidth
        open={!!paywallToDelete}
        maxWidth="xs"
        onClose={() => setPaywallToDelete(undefined)}
      >
        <DialogTitle>{t('paywall.overview.areYouSure')}</DialogTitle>

        <DialogContent>
          {paywallToDelete &&
            t('paywall.overview.areYouSureBody', {
              paywall: paywallToDelete.name,
            })}
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              deletePaywall({
                variables: {
                  id: paywallToDelete?.id ?? '',
                },
              });
              setPaywallToDelete(undefined);
            }}
          >
            {t('paywall.overview.areYouSureConfirmation')}
          </Button>

          <Button
            variant="text"
            onClick={() => setPaywallToDelete(undefined)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreatePaywall.id,
  CanUpdatePaywall.id,
  CanDeletePaywall.id,
])(PaywallList);

export { CheckedPermissionComponent as PaywallList };
