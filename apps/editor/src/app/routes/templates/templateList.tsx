import { TypedDocumentNode } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  ConfirmActionModal,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  IconButton,
  IconButtonCell,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdContentCopy, MdDelete, MdInfo } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconButton as RIconButton,
  Message,
  Pagination,
  Table as RTable,
  toaster,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

export type TemplateRow = { id: string; blockTemplate: { name: string } };

type TemplateListVariables = {
  take?: number | null;
  skip?: number | null;
};

export type TemplateListProps<Data> = {
  listDocument: TypedDocumentNode<Data, TemplateListVariables>;
  deleteDocument: TypedDocumentNode<unknown, { id: string }>;
  selectTemplates(
    data: Data | undefined
  ): { nodes: TemplateRow[]; totalCount: number } | undefined;
  /** e.g. `/articles/templates`; rows link to `${basePath}/edit/:id`. */
  basePath: string;
  permissions: { create: string; delete: string };
  /** Translation namespace with `list.*` and `delete.*` keys. */
  i18nPrefix: string;
};

const onErrorToast = (error: Error) => {
  if (error?.message) {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error?.message}
      </Message>
    );
  }
};

export function TemplateList<Data>({
  listDocument,
  deleteDocument,
  selectTemplates,
  basePath,
  permissions,
  i18nPrefix,
}: TemplateListProps<Data>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [templateDelete, setTemplateDelete] = useState<TemplateRow | undefined>(
    undefined
  );
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const [deleteTemplate] = useMutation(deleteDocument, {
    onError: onErrorToast,
    onCompleted: () =>
      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('toast.deletedSuccess')}
        </Message>
      ),
  });

  const { data, loading, refetch, error } = useQuery(listDocument, {
    variables: {
      take: limit,
      skip: (page - 1) * limit,
    },
    fetchPolicy: 'cache-and-network',
  });
  const templates = selectTemplates(data);

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

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
          <h2>{t(`${i18nPrefix}.list.title`)}</h2>
          <IconButtonTooltip caption={t(`${i18nPrefix}.list.info`)}>
            <MdInfo />
          </IconButtonTooltip>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[permissions.create]}>
          <ListViewActions>
            <Link to={`${basePath}/create`}>
              <RIconButton
                appearance="primary"
                disabled={loading}
                icon={<MdAdd />}
              >
                {t(`${i18nPrefix}.list.newTemplate`)}
              </RIconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={templates?.nodes ?? []}
        >
          <Column
            flexGrow={1}
            resizable
          >
            <HeaderCell>{t(`${i18nPrefix}.list.name`)}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<TemplateRow>) => (
                <Link to={`${basePath}/edit/${rowData.id}`}>
                  {rowData.blockTemplate.name || t(`${i18nPrefix}.list.noName`)}
                </Link>
              )}
            </RCell>
          </Column>
          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell>{t(`${i18nPrefix}.list.action`)}</HeaderCell>
            <IconButtonCell>
              {(template: RowDataType<TemplateRow>) => (
                <>
                  <PermissionControl
                    qualifyingPermissions={[permissions.create]}
                  >
                    <IconButtonTooltip caption={t(`${i18nPrefix}.list.copy`)}>
                      <IconButton
                        icon={<MdContentCopy />}
                        aria-label={t(`${i18nPrefix}.list.copy`)}
                        circle
                        size="sm"
                        onClick={() =>
                          navigate(
                            `${basePath}/create?copyFrom=${encodeURIComponent(template.id)}`
                          )
                        }
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[permissions.delete]}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        icon={<MdDelete />}
                        aria-label={t('delete')}
                        circle
                        size="sm"
                        appearance="ghost"
                        color="red"
                        onClick={() =>
                          setTemplateDelete(template as TemplateRow)
                        }
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                </>
              )}
            </IconButtonCell>
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
          total={templates?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => {
            setLimit(limit);
            setPage(1);
          }}
        />
      </TableWrapper>

      {templateDelete && (
        <ConfirmActionModal
          title={t(`${i18nPrefix}.delete.title`)}
          message={t(`${i18nPrefix}.delete.body`, {
            name: templateDelete.blockTemplate.name,
          })}
          onConfirm={async () => {
            await deleteTemplate({
              variables: { id: templateDelete.id },
            });
            setTemplateDelete(undefined);
            refetch();
          }}
          onClose={() => setTemplateDelete(undefined)}
        />
      )}
    </>
  );
}
