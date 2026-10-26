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
  DataTable,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  TableWrapper,
  PageTitle,
} from '@wepublish/ui/editor';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

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
          <PageTitle>{t('paywall.overview.title')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <Button
            component={RouterLink}
            to="create"
            variant="contained"
            loading={false}
            startIcon={<MdAdd />}
          >
            {t('paywall.overview.createPaywall')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="paywalls"
          data={data?.paywalls ?? []}
          loading={loading}
          columns={[
            {
              id: 'active',
              label: t('paywall.overview.active'),
              width: 75,
              render: rowData => (rowData.active ? `✅` : `❌`),
            },
            {
              id: 'name',
              alwaysVisible: true,
              label: t('paywall.overview.name'),
              width: 300,
              render: rowData => (
                <Link to={`edit/${rowData.id}`}>{rowData.name}</Link>
              ),
            },
            {
              id: 'memberplans',
              label: t('paywall.overview.memberPlans'),
              width: 500,
              render: rowData =>
                rowData.anyMemberPlan ?
                  t('paywall.overview.anyMemberPlan')
                : rowData.memberPlans.map((mb, index) => (
                    <Fragment key={mb.id}>
                      <Link to={`/memberplans/edit/${mb.id}`}>{mb.name}</Link>

                      {!!rowData.memberPlans.at(index + 1) && <>, </>}
                    </Fragment>
                  )),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: paywall => (
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
              ),
            },
          ]}
        />
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
            variant="text"
            onClick={() => setPaywallToDelete(undefined)}
          >
            {t('cancel')}
          </Button>

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
