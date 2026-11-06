import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  DeletePaymentMethodDocument,
  FullPaymentMethodFragment,
  PaymentMethodListDocument,
} from '@wepublish/editor/api';
import {
  CanCreatePaymentMethod,
  CanDeletePaymentMethod,
  CanGetPaymentMethod,
  CanGetPaymentMethods,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  DescriptionList,
  DescriptionListItem,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  TableWrapper,
  PageTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { paymentMethodRoutes } from './paymentMethod.view';
import { PaymentMethodDrawer } from './paymentMethodDrawer';

const hasBrokenPaymentProvider = ({
  paymentProvider,
}: FullPaymentMethodFragment) => Boolean(paymentProvider);

function PaymentMethodList() {
  const { t } = useTranslation();

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] =
    useState<FullPaymentMethodFragment>();

  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery(PaymentMethodListDocument, {});

  const paymentMethods = data?.paymentMethods ?? [];

  const [deletePaymentMethod, { loading: isDeleting }] = useMutation(
    DeletePaymentMethodDocument
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('paymentMethodList.title')}</PageTitle>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreatePaymentMethod.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to={paymentMethodRoutes.create}
              variant="contained"
              disabled={isLoading}
              startIcon={<MdAdd />}
            >
              {t('paymentMethodList.createNew')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="payment-methods"
          data={paymentMethods}
          loading={isLoading}
          columns={[
            {
              id: 'paymentproviderstatusinfo',
              label: (
                <InfoTooltip
                  text={t('paymentMethodList.paymentProviderStatusInfo')}
                />
              ),
              width: 40,
              align: 'left',
              render: rowData =>
                hasBrokenPaymentProvider(rowData as FullPaymentMethodFragment) ?
                  `✅`
                : `❌`,
            },
            {
              id: 'name',
              alwaysVisible: true,
              label: t('paymentMethodList.name'),
              width: 200,
              align: 'left',
              render: rowData => (
                <Link to={`/paymentmethods/edit/${rowData.id}`}>
                  {rowData.name || t('untitled')}
                </Link>
              ),
            },
            {
              id: 'providername',
              label: t('paymentMethodList.providerName'),
              width: 200,
              align: 'left',
              render: rowData => <div>{rowData.paymentProvider?.name}</div>,
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: rowData => (
                <PermissionControl
                  qualifyingPermissions={[CanDeletePaymentMethod.id]}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      color="error"
                      size="small"
                      aria-label={t('delete')}
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentPaymentMethod(
                          rowData as FullPaymentMethodFragment
                        );
                      }}
                    >
                      <MdDelete />
                    </IconButton>
                  </IconButtonTooltip>
                </PermissionControl>
              ),
            },
          ]}
        />
      </TableWrapper>

      <Dialog
        fullWidth
        open={isConfirmationDialogOpen}
        maxWidth="sm"
      >
        <DialogTitle>{t('paymentMethodList.deleteModalTitle')}</DialogTitle>

        <DialogContent>
          <DescriptionList>
            <DescriptionListItem label={t('paymentMethodList.name')}>
              {currentPaymentMethod?.name || t('untitled')}
            </DescriptionListItem>
          </DescriptionList>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentPaymentMethod) {
                return;
              }

              await deletePaymentMethod({
                variables: { id: currentPaymentMethod.id },
              });

              await refetch();
              setConfirmationDialogOpen(false);
            }}
            color="error"
          >
            {t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <PaymentMethodDrawer />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPaymentMethods.id,
  CanGetPaymentMethod.id,
  CanCreatePaymentMethod.id,
  CanDeletePaymentMethod.id,
])(PaymentMethodList);
export { CheckedPermissionComponent as PaymentMethodList };
