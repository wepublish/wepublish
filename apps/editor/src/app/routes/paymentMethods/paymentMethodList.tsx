import {
  FullPaymentMethodFragment,
  useDeletePaymentMethodMutation,
  usePaymentMethodListQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  IconButton,
  IconButtonTooltip,
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
import { Button, Drawer, Modal, Table as RTable } from 'rsuite';
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
  } = usePaymentMethodListQuery({
    fetchPolicy: 'network-only',
  });

  const [deletePaymentMethod, { loading: isDeleting }] =
    useDeletePaymentMethodMutation();

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
              <IconButton
                appearance="primary"
                disabled={isLoading}
                icon={<MdAdd />}
              >
                {t('paymentMethodList.createNew')}
              </IconButton>
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
            <HeaderCell>{''}</HeaderCell>
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
            <HeaderCell>{t('paymentMethodList.action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullPaymentMethodFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_DELETE_PAYMENT_METHOD']}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      icon={<MdDelete />}
                      circle
                      appearance="ghost"
                      color="red"
                      size="sm"
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentPaymentMethod(
                          rowData as FullPaymentMethodFragment
                        );
                      }}
                    />
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <Drawer
        open={isEditModalOpen}
        size="sm"
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

      <Modal
        open={isConfirmationDialogOpen}
        size="sm"
      >
        <Modal.Header>
          <Modal.Title>{t('paymentMethodList.deleteModalTitle')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('paymentMethodList.name')}>
              {currentPaymentMethod?.name || t('untitled')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentPaymentMethod) return;

              await deletePaymentMethod({
                variables: { id: currentPaymentMethod.id },
              });

              await refetch();
              setConfirmationDialogOpen(false);
            }}
            color="red"
          >
            {t('confirm')}
          </Button>
          <Button
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
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
