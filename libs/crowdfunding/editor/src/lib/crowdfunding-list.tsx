import { useState } from 'react';
import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  createCheckedPermissionComponent,
  IconButton,
  TableWrapper,
  PaddedCell,
} from '@wepublish/ui/editor';
import { MdAdd, MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Table as RTable, Table } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';
import { Crowdfunding, useCrowdfundingsQuery } from '@wepublish/editor/api';
import { CrowdfundingDeleteModal } from './crowdfunding-delete-modal';

const { Column, HeaderCell, Cell: RCell } = RTable;

function CrowdfundingList() {
  const { t } = useTranslation();

  const [crowdfundingDelete, setCrowdfundingDelete] = useState<
    Crowdfunding | undefined
  >(undefined);

  const { data, loading, error, refetch } = useCrowdfundingsQuery({});

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('crowdfunding.list.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <IconButton
              appearance="primary"
              loading={false}
            >
              <MdAdd />
              {t('crowdfunding.list.createNew')}
            </IconButton>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.crowdfundings || []}
        >
          <Column
            width={300}
            resizable
          >
            <HeaderCell>{t('crowdfunding.list.name')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<Crowdfunding>) => (
                <Link to={`/crowdfundings/edit/${rowData.id}`}>
                  {rowData.name || 'Crowdfunding ohne Namen'}
                </Link>
              )}
            </RCell>
          </Column>
          <Column
            resizable
            fixed="right"
          >
            <HeaderCell align={'center'}>
              {t('crowdfunding.list.delete')}
            </HeaderCell>
            <PaddedCell align={'center'}>
              {(crowdfunding: RowDataType<Crowdfunding>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() =>
                    setCrowdfundingDelete(crowdfunding as Crowdfunding)
                  }
                />
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <CrowdfundingDeleteModal
        crowdfunding={crowdfundingDelete}
        onDelete={refetch}
        onClose={() => setCrowdfundingDelete(undefined)}
      />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_CROWDFUNDINGS',
  'CAN_GET_CROWDFUNDING',
  'CAN_CREATE_CROWDFUNDING',
  'CAN_DELETE_CROWDFUNDING',
])(CrowdfundingList);

export { CheckedPermissionComponent as CrowdfundingList };
