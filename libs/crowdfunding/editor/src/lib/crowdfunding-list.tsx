import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  createCheckedPermissionComponent,
  IconButton,
  TableWrapper,
  PaddedCell,
  Table,
} from '@wepublish/ui/editor';
import { MdAdd, MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { IconButton as RIconButton, Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';
import {
  CrowdfundingsDocument,
  FullCrowdfundingFragment,
} from '@wepublish/editor/api';
import { CrowdfundingDeleteModal } from './crowdfunding-delete-modal';

const { Column, HeaderCell, Cell: RCell } = RTable;

function CrowdfundingList() {
  const { t } = useTranslation();

  const [crowdfundingDelete, setCrowdfundingDelete] = useState<
    FullCrowdfundingFragment | undefined
  >(undefined);

  const { data, loading, error, refetch } = useQuery(CrowdfundingsDocument, {});

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('crowdfunding.list.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <RIconButton
              appearance="primary"
              icon={<MdAdd />}
            >
              {t('crowdfunding.list.createNew')}
            </RIconButton>
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
              {(rowData: RowDataType<FullCrowdfundingFragment>) => (
                <Link to={`/crowdfundings/edit/${rowData.id}`}>
                  {rowData.name || 'FullCrowdfundingFragment ohne Namen'}
                </Link>
              )}
            </RCell>
          </Column>

          <Column
            width={100}
            resizable={false}
            fixed="right"
          >
            <HeaderCell align={'center'}>
              {t('crowdfunding.list.delete')}
            </HeaderCell>

            <PaddedCell align={'center'}>
              {(crowdfunding: RowDataType<FullCrowdfundingFragment>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() =>
                    setCrowdfundingDelete(
                      crowdfunding as FullCrowdfundingFragment
                    )
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
