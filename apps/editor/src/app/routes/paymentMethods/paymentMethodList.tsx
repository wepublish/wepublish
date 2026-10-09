import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
} from '@mui/material';
import {
  DeletePaymentMethodDocument,
  FullPaymentMethodFragment,
  PaymentMethodListDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  DRAWER_WIDTHS,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  PaymentMethodEditPanel,
  PermissionControl,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

const hasBrokenPaymentProvider = ({
  paymentProvider,
}: FullPaymentMethodFragment) => Boolean(paymentProvider);

function PaymentMethodList() {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { id } = params;

  const isCreateRoute = location.pathname.includes('create');
  const isEditRoute = location.pathname.includes('edit');

  const [isEditModalOpen, setEditModalOpen] = useState(
    isEditRoute || isCreateRoute
  );

  const [editID, setEditID] = useState<string | undefined>(
    isEditRoute ? id : undefined
  );

  const [paymentMethods, setPaymentMethods] = useState<
    FullPaymentMethodFragment[]
  >([]);

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] =
    useState<FullPaymentMethodFragment>();

  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery(PaymentMethodListDocument, {});

  const [deletePaymentMethod, { loading: isDeleting }] = useMutation(
    DeletePaymentMethodDocument
  );

  useEffect(() => {
    if (isCreateRoute) {
      setEditID(undefined);
      setEditModalOpen(true);
    }

    if (isEditRoute) {
      setEditID(id);
      setEditModalOpen(true);
    }
  }, [location]);

  useEffect(() => {
    if (data?.paymentMethods) {
      setPaymentMethods(data.paymentMethods);
    }
  }, [data?.paymentMethods]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('paymentMethodList.title')}</h2>
        </ListViewHeader>
        <PermissionControl
          qualifyingPermissions={['CAN_CREATE_PAYMENT_METHOD']}
        >
          <ListViewActions>
            <Link to="/paymentmethods/create">
              <Button
                variant="contained"
                disabled={isLoading}
                startIcon={<MdAdd />}
              >
                {t('paymentMethodList.createNew')}
              </Button>
            </Link>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={isLoading}
          data={paymentMethods}
        >
          <Column
            width={40}
            align="left"
          >
            <HeaderCell>
              <InfoTooltip
                text={t('paymentMethodList.paymentProviderStatusInfo')}
              />
            </HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullPaymentMethodFragment>) =>
                hasBrokenPaymentProvider(rowData as FullPaymentMethodFragment) ?
                  `✅`
                : `❌`
              }
            </RCell>
          </Column>

          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('paymentMethodList.name')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullPaymentMethodFragment>) => (
                <Link to={`/paymentmethods/edit/${rowData.id}`}>
                  {rowData.name || t('untitled')}
                </Link>
              )}
            </RCell>
          </Column>

          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('paymentMethodList.providerName')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullPaymentMethodFragment>) => (
                <div>{rowData.paymentProvider?.name}</div>
              )}
            </RCell>
          </Column>

          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullPaymentMethodFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_DELETE_PAYMENT_METHOD']}
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
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          navigate('/paymentmethods');
        }}
      >
        <PaymentMethodEditPanel
          id={editID}
          onClose={async () => {
            setEditModalOpen(false);
            navigate('/paymentmethods');
            await refetch();
          }}
          onSave={async () => {
            setEditModalOpen(false);
            navigate('/paymentmethods');
            await refetch();
          }}
        />
      </Drawer>

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
            variant="outlined"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentPaymentMethod) return;

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
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PAYMENT_METHODS',
  'CAN_GET_PAYMENT_METHOD',
  'CAN_CREATE_PAYMENT_METHOD',
  'CAN_DELETE_PAYMENT_METHOD',
])(PaymentMethodList);
export { CheckedPermissionComponent as PaymentMethodList };
