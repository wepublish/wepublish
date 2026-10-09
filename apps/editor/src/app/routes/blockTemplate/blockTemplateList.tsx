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
  enqueueSnackbar,
  humanizeError,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  Pagination,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { DeleteBlockTemplateModal } from './deleteBlockTemplateModal';

const onErrorToast = (error: Error) => {
  if (error?.message) {
    enqueueSnackbar(error && humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  }
};

function BlockTemplateList() {
  const { t } = useTranslation();
  const [blockTemplateDelete, setBlockTemplateDelete] = useState<
    BlockTemplate | undefined
  >(undefined);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const { data, loading, refetch, error } = useQuery(
    BlockTemplateListDocument,
    {
      variables: {
        take: limit,
        skip: (page - 1) * limit,
      },
    }
  );

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

  /**
   * Refetch data
   */
  useEffect(() => {
    refetch({
      take: limit,
      skip: (page - 1) * limit,
    });
  }, [page, limit, refetch]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('blockTemplates.list.title')}</h2>
          <InfoTooltip text={t('blockTemplates.list.info')} />
        </ListViewHeader>

        <ListViewActions>
          <Link to="/block-content/templates/create">
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              disabled={loading}
            >
              {t('blockTemplates.list.newBlockTemplate')}
            </Button>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          data={data?.blockTemplates?.nodes || []}
          loading={loading}
          columns={[
            {
              id: 'name',
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
