import { useQuery } from '@apollo/client/react';
import { Button, IconButton } from '@mui/material';
import {
  BlockTemplate,
  BlockTemplateListDocument,
} from '@wepublish/editor/api';
import {
  CanCreateBlockTemplate,
  CanDeleteBlockTemplate,
  CanUpdateBlockTemplate,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  IconButtonTooltip,
  InfoTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  Pagination,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { DeleteBlockTemplateModal } from './deleteBlockTemplateModal';

function BlockTemplateList() {
  const { t } = useTranslation();
  const [blockTemplateDelete, setBlockTemplateDelete] = useState<
    BlockTemplate | undefined
  >(undefined);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const { data, loading, refetch } = useQuery(BlockTemplateListDocument, {
    variables: {
      take: limit,
      skip: (page - 1) * limit,
    },
  });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('blockTemplates.list.title')}</PageTitle>

          <InfoTooltip text={t('blockTemplates.list.info')} />
        </ListViewHeader>

        <ListViewActions>
          <Button
            component={RouterLink}
            to="/block-content/templates/create"
            variant="contained"
            startIcon={<MdAdd />}
          >
            {t('blockTemplates.list.newBlockTemplate')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="block-templates"
          data={data?.blockTemplates?.nodes || []}
          loading={loading}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
              label: t('blockTemplates.list.name'),
              render: rowData => (
                <Link to={`/block-content/templates/edit/${rowData.id}`}>
                  {rowData.name || t('blockTemplates.list.noName')}
                </Link>
              ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: blockTemplate => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    aria-label={t('delete')}
                    color="error"
                    size="small"
                    onClick={() =>
                      setBlockTemplateDelete(blockTemplate as BlockTemplate)
                    }
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              ),
            },
          ]}
        />

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit,
          }}
          totalCount={data?.blockTemplates?.totalCount ?? 0}
        />
      </TableWrapper>

      <DeleteBlockTemplateModal
        blockTemplate={blockTemplateDelete}
        onDelete={refetch}
        onClose={() => setBlockTemplateDelete(undefined)}
      />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateBlockTemplate.id,
  CanUpdateBlockTemplate.id,
  CanDeleteBlockTemplate.id,
])(BlockTemplateList);

export { CheckedPermissionComponent as BlockTemplateList };
