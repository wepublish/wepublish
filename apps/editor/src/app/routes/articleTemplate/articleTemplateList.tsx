import { useMutation, useQuery } from '@apollo/client/react';
import {
  ArticleTemplateListDocument,
  ArticleTemplateListQuery,
  DeleteArticleTemplateDocument,
} from '@wepublish/editor/api';
import {
  CanCreateArticleTemplate,
  CanDeleteArticleTemplate,
  CanUpdateArticleTemplate,
} from '@wepublish/permissions';
import {
  ConfirmActionModal,
  createCheckedPermissionComponent,
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

type ArticleTemplateRow =
  ArticleTemplateListQuery['articleTemplates']['nodes'][number];

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

function ArticleTemplateList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [articleTemplateDelete, setArticleTemplateDelete] = useState<
    ArticleTemplateRow | undefined
  >(undefined);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const [deleteArticleTemplate] = useMutation(DeleteArticleTemplateDocument, {
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

  const { data, loading, refetch, error } = useQuery(
    ArticleTemplateListDocument,
    {
      variables: {
        take: limit,
        skip: (page - 1) * limit,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

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
          <h2>{t('articleTemplates.list.title')}</h2>
          <IconButtonTooltip caption={t('articleTemplates.list.info')}>
            <MdInfo />
          </IconButtonTooltip>
        </ListViewHeader>

        <PermissionControl
          qualifyingPermissions={[CanCreateArticleTemplate.id]}
        >
          <ListViewActions>
            <Link to="/articles/templates/create">
              <RIconButton
                appearance="primary"
                disabled={loading}
                icon={<MdAdd />}
              >
                {t('articleTemplates.list.newArticleTemplate')}
              </RIconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.articleTemplates?.nodes || []}
        >
          <Column
            flexGrow={1}
            resizable
          >
            <HeaderCell>{t('articleTemplates.list.name')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<ArticleTemplateRow>) => (
                <Link to={`/articles/templates/edit/${rowData.id}`}>
                  {rowData.blockTemplate.name ||
                    t('articleTemplates.list.noName')}
                </Link>
              )}
            </RCell>
          </Column>
          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell>{t('articleTemplates.list.action')}</HeaderCell>
            <IconButtonCell>
              {(articleTemplate: RowDataType<ArticleTemplateRow>) => (
                <>
                  <PermissionControl
                    qualifyingPermissions={[CanCreateArticleTemplate.id]}
                  >
                    <IconButtonTooltip
                      caption={t('articleTemplates.list.copy')}
                    >
                      <IconButton
                        icon={<MdContentCopy />}
                        aria-label={t('articleTemplates.list.copy')}
                        circle
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/articles/templates/create?copyFrom=${encodeURIComponent(articleTemplate.id)}`
                          )
                        }
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[CanDeleteArticleTemplate.id]}
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
                          setArticleTemplateDelete(
                            articleTemplate as ArticleTemplateRow
                          )
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
          total={data?.articleTemplates?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => {
            setLimit(limit);
            setPage(1);
          }}
        />
      </TableWrapper>

      {articleTemplateDelete && (
        <ConfirmActionModal
          title={t('articleTemplates.delete.title')}
          message={t('articleTemplates.delete.body', {
            name: articleTemplateDelete.blockTemplate.name,
          })}
          onConfirm={async () => {
            await deleteArticleTemplate({
              variables: { id: articleTemplateDelete.id },
            });
            setArticleTemplateDelete(undefined);
            refetch();
          }}
          onClose={() => setArticleTemplateDelete(undefined)}
        />
      )}
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateArticleTemplate.id,
  CanUpdateArticleTemplate.id,
  CanDeleteArticleTemplate.id,
])(ArticleTemplateList);

export { CheckedPermissionComponent as ArticleTemplateList };
