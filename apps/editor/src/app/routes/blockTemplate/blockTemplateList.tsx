import { useQuery } from '@apollo/client/react';
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
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  humanizeError,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  IconButton,
  Message,
  Pagination,
  Table as RTable,
  toaster,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { DeleteBlockTemplateModal } from './deleteBlockTemplateModal';

const { Column, HeaderCell, Cell: RCell } = RTable;

const onErrorToast = (error: Error) => {
  if (error?.message) {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={8000}
      >
        {error && humanizeError(error)}
      </Message>
    );
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
            <IconButton
              appearance="primary"
              disabled={loading}
              icon={<MdAdd />}
            >
              {t('blockTemplates.list.newBlockTemplate')}
            </IconButton>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.blockTemplates?.nodes || []}
        >
          <Column
            flexGrow={1}
            resizable
          >
            <HeaderCell>{t('blockTemplates.list.name')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<BlockTemplate>) => (
                <Link to={`/block-content/templates/edit/${rowData.id}`}>
                  {rowData.name || t('blockTemplates.list.noName')}
                </Link>
              )}
            </RCell>
          </Column>
          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell align="center">
              {(blockTemplate: RowDataType<BlockTemplate>) => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    aria-label={t('delete')}
                    icon={<MdDelete />}
                    circle
                    appearance="ghost"
                    color="red"
                    size="sm"
                    onClick={() =>
                      setBlockTemplateDelete(blockTemplate as BlockTemplate)
                    }
                  />
                </IconButtonTooltip>
              )}
            </PaddedCell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.blockTemplates?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
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
