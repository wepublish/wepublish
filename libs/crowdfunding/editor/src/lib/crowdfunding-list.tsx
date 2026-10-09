import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  createCheckedPermissionComponent,
  IconButton,
  IconButtonTooltip,
  TableWrapper,
  DataTable,
} from '@wepublish/ui/editor';
import { MdAdd, MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  CrowdfundingsDocument,
  FullCrowdfundingFragment,
} from '@wepublish/editor/api';
import { CrowdfundingDeleteModal } from './crowdfunding-delete-modal';
import { Button } from '@mui/material';

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
            <Button
              variant="contained"
              startIcon={<MdAdd />}
            >
              {t('crowdfunding.list.createNew')}
            </Button>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          data={data?.crowdfundings || []}
          loading={loading}
          columns={[
            {
              id: 'name',
              label: t('crowdfunding.list.name'),
              width: 300,
              render: rowData => (
                <Link to={`/crowdfundings/edit/${rowData.id}`}>
                  {rowData.name || t('crowdfunding.list.unnamed')}
                </Link>
              ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: crowdfunding => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    aria-label={t('delete')}
                    color="error"
                    size="small"
                    onClick={() =>
                      setCrowdfundingDelete(
                        crowdfunding as FullCrowdfundingFragment
                      )
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
