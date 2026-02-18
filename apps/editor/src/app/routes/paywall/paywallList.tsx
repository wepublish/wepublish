import styled from '@emotion/styled';
import {
  Paywall,
  useDeletePaywallMutation,
  usePaywallListQuery,
} from '@wepublish/editor/api';
import {
  CanCreatePaywall,
  CanDeletePaywall,
  CanUpdatePaywall,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
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
import {
  Button,
  IconButton as RIconButton,
  Modal,
  Table as RTable,
} from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

const IconButton = styled(RIconButton)`
  margin-left: 12px;
`;

const { Column, HeaderCell, Cell: RCell } = RTable;

function PaywallList() {
  const { t } = useTranslation();
  const [paywallToDelete, setPaywallToDelete] = useState<Paywall | undefined>(
    undefined
  );

  const { data, loading, refetch } = usePaywallListQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [deletePaywall] = useDeletePaywallMutation({
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
            <IconButton
              appearance="primary"
              loading={false}
            >
              <MdAdd />
              {t('paywall.overview.createPaywall')}
            </IconButton>
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
              {(rowData: RowDataType<Paywall>) =>
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
              {(rowData: RowDataType<Paywall>) => (
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
              {(rowData: Paywall) =>
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
            resizable
            fixed="right"
          >
            <HeaderCell align={'center'}>{t('delete')}</HeaderCell>
            <PaddedCell align={'center'}>
              {(paywall: RowDataType<Paywall>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() => setPaywallToDelete(paywall as Paywall)}
                />
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <Modal
        open={!!paywallToDelete}
        backdrop="static"
        size="xs"
        onClose={() => setPaywallToDelete(undefined)}
      >
        <Modal.Title>{t('paywall.overview.areYouSure')}</Modal.Title>

        <Modal.Body>
          {paywallToDelete &&
            t('paywall.overview.areYouSureBody', {
              paywall: paywallToDelete.name,
            })}
        </Modal.Body>

        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
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
            appearance="subtle"
            onClick={() => setPaywallToDelete(undefined)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreatePaywall.id,
  CanUpdatePaywall.id,
  CanDeletePaywall.id,
])(PaywallList);

export { CheckedPermissionComponent as PaywallList };
