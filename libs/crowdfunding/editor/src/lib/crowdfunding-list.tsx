import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
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
import { MdAdd, MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import {
  CrowdfundingsDocument,
  FullCrowdfundingFragment,
} from '@wepublish/editor/api';
import { CrowdfundingDeleteModal } from './crowdfunding-delete-modal';
import { Button } from '@mui/material';
import {
  CanCreateCrowdfunding,
  CanDeleteCrowdfunding,
  CanGetCrowdfunding,
  CanGetCrowdfundings,
} from '@wepublish/permissions';

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
          <PageTitle>{t('crowdfunding.list.title')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <Button
            component={RouterLink}
            to="create"
            variant="contained"
            startIcon={<MdAdd />}
          >
            {t('crowdfunding.list.createNew')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="crowdfundings"
          data={data?.crowdfundings || []}
          loading={loading}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
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
  CanGetCrowdfundings.id,
  CanGetCrowdfunding.id,
  CanCreateCrowdfunding.id,
  CanDeleteCrowdfunding.id,
])(CrowdfundingList);

export { CheckedPermissionComponent as CrowdfundingList };
