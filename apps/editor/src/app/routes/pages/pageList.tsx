import { useMutation, useQuery } from '@apollo/client/react';
import {
  CommentItemType,
  CreateCommentDocument,
  DeletePageDocument,
  DuplicatePageDocument,
  FullPageFragment,
  PageFilter,
  PageListDocument,
  PageListQuery,
  PageSort,
  TagType,
  UnpublishPageDocument,
} from '@wepublish/editor/api';
import { CanPreview } from '@wepublish/permissions';
import {
  ColumnConfigurator,
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  DescriptionList,
  DescriptionListItem,
  IconButton,
  IconButtonCell,
  IconButtonTooltip,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PermissionControl,
  StatusBadge,
  Table,
  TableWrapper,
  ListColumn,
  renderListColumns,
  useColumnConfig,
  useListViewState,
} from '@wepublish/ui/editor';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdComment,
  MdContentCopy,
  MdDelete,
  MdUnpublished,
} from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  IconButton as RIconButton,
  Message,
  Modal,
  Pagination,
  Table as RTable,
} from 'rsuite';
import type { RowDataType } from 'rsuite-table';

interface State {
  state: string;
  text: string;
}

const { Column, HeaderCell } = RTable;

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish',
  Duplicate = 'duplicate',
}

function mapColumFieldToGraphQLField(columnField: string): PageSort | null {
  switch (columnField) {
    case 'createdAt':
      return PageSort.CreatedAt;
    case 'modifiedAt':
      return PageSort.ModifiedAt;
    case 'publishedAt':
      return PageSort.PublishedAt;
    default:
      return null;
  }
}

function PageList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { filter, setFilter, sortField, sortOrder, setSort, limit, setLimit } =
    useListViewState<PageFilter>('pages');

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<FullPageFragment>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>();

  const [page, setPage] = useState(1);

  const [deletePage, { loading: isDeleting }] = useMutation(
    DeletePageDocument,
    {}
  );
  const [unpublishPage, { loading: isUnpublishing }] = useMutation(
    UnpublishPageDocument,
    {}
  );
  const [duplicatePage, { loading: isDuplicating }] = useMutation(
    DuplicatePageDocument,
    {}
  );

  const pageListVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (page - 1) * limit,
    sort: mapColumFieldToGraphQLField(sortField),
    order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
  };

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(PageListDocument, {
    variables: pageListVariables,
  });

  const pages = useMemo(() => data?.pages?.nodes ?? [], [data]);

  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  useEffect(() => {
    const timerID = setTimeout(() => {
      setHighlightedRowId(null);
    }, 3000);
    return () => {
      clearTimeout(timerID);
    };
  }, [highlightedRowId]);

  useEffect(() => {
    refetch(pageListVariables);
  }, [filter, page, limit, sortOrder, sortField]);

  const [createComment] = useMutation(CreateCommentDocument, {});

  const dataColumns = useMemo<ListColumn<FullPageFragment>[]>(
    () => [
      {
        id: 'states',
        label: t('pages.overview.states'),
        width: 190,
        resizable: false,
        alwaysVisible: true,
        render: page => {
          const states: State[] = [];

          if (page.draft) {
            states.push({ state: 'draft', text: t('pages.overview.draft') });
          }
          if (page.pending) {
            states.push({
              state: 'pending',
              text: t('pages.overview.pending'),
            });
          }
          if (page.published) {
            states.push({
              state: 'published',
              text: t('pages.overview.published'),
            });
          }

          return (
            <StatusBadge states={states.map(st => st.state)}>
              {states.map(st => st.text).join(' / ')}
            </StatusBadge>
          );
        },
      },
      {
        id: 'title',
        label: t('pages.overview.title'),
        width: 400,
        alwaysVisible: true,
        render: page => (
          <Link to={`/pages/edit/${page.id}`}>
            {page.latest.title || t('pages.overview.untitled')}
          </Link>
        ),
      },
      {
        id: 'slug',
        label: t('pages.overview.slug'),
        width: 210,
        dataKey: 'slug',
        render: page => page.slug,
      },
      {
        id: 'publishedAt',
        label: t('pages.overview.publicationDate'),
        width: 210,
        sortable: true,
        dataKey: 'publishedAt',
        alwaysVisible: true,
        render: page =>
          page.published?.publishedAt ?
            t('pageEditor.overview.publishedAt', {
              publicationDate: new Date(page.published.publishedAt),
            })
          : page.pending?.publishedAt ?
            t('pageEditor.overview.publishedAtIfPending', {
              publishedAtIfPending: new Date(page.pending.publishedAt),
            })
          : t('pages.overview.notPublished'),
      },
      {
        id: 'modifiedAt',
        label: t('pages.overview.updated'),
        width: 210,
        sortable: true,
        dataKey: 'modifiedAt',
        alwaysVisible: true,
        render: page =>
          t('pageEditor.overview.modifiedAt', {
            modificationDate: new Date(page.modifiedAt),
          }),
      },
    ],
    [t]
  );

  const { isVisible, toggle, configurableColumns } = useColumnConfig(
    'pages',
    dataColumns
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('pages.overview.pages')}</h2>

          <ColumnConfigurator
            columns={configurableColumns}
            isVisible={isVisible}
            onToggle={toggle}
          />
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_PAGE']}>
          <ListViewActions>
            <Link to="/pages/create">
              <RIconButton
                appearance="primary"
                disabled={isLoading}
                icon={<MdAdd />}
              >
                {t('pages.overview.newPage')}
              </RIconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>

        <ListFilters
          fields={[
            'title',
            'description',
            'slug',
            'draft',
            'pending',
            'published',
            'publicationDate',
            'includeHidden',
          ]}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => {
            setFilter(filter);
            setPage(1);
          }}
          tagType={TagType.Page}
        />
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={isLoading}
          data={pages}
          sortColumn={sortField}
          sortType={sortOrder}
          rowClassName={rowData =>
            rowData?.id === highlightedRowId ? 'highlighted-row' : ''
          }
          onSortColumn={(sortColumn, sortType) => {
            setSort(sortColumn, sortType ?? 'asc');
            setPage(1);
          }}
        >
          {renderListColumns(dataColumns, isVisible)}

          <Column
            width={220}
            align="center"
            fixed="right"
          >
            <HeaderCell>{t('pages.overview.action')}</HeaderCell>
            <IconButtonCell>
              {(rowData: RowDataType<FullPageFragment>) => (
                <>
                  <PermissionControl
                    qualifyingPermissions={['CAN_PUBLISH_PAGE']}
                  >
                    <IconButtonTooltip
                      caption={t('pageEditor.overview.unpublish')}
                    >
                      <IconButton
                        icon={<MdUnpublished />}
                        circle
                        disabled={!(rowData.published || rowData.pending)}
                        size="sm"
                        onClick={e => {
                          setCurrentPage(rowData as FullPageFragment);
                          setConfirmAction(ConfirmAction.Unpublish);
                          setConfirmationDialogOpen(true);
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={['CAN_CREATE_PAGE']}
                  >
                    <IconButtonTooltip
                      caption={t('pageEditor.overview.duplicate')}
                    >
                      <IconButton
                        icon={<MdContentCopy />}
                        circle
                        size="sm"
                        onClick={() => {
                          setCurrentPage(rowData as FullPageFragment);
                          setConfirmAction(ConfirmAction.Duplicate);
                          setConfirmationDialogOpen(true);
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={['CAN_UPDATE_COMMENTS']}
                  >
                    <IconButtonTooltip
                      caption={t('pageEditor.overview.createComment')}
                    >
                      <IconButton
                        icon={<MdComment />}
                        circle
                        size="sm"
                        onClick={() => {
                          createComment({
                            variables: {
                              itemID: rowData.id,
                              itemType: CommentItemType.Article,
                            },
                            onCompleted(data) {
                              navigate(
                                `/comments/edit/${data?.createComment.id}`
                              );
                            },
                          });
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={['CAN_DELETE_PAGE']}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        icon={<MdDelete />}
                        circle
                        size="sm"
                        appearance="ghost"
                        color="red"
                        onClick={() => {
                          setCurrentPage(rowData as FullPageFragment);
                          setConfirmAction(ConfirmAction.Delete);
                          setConfirmationDialogOpen(true);
                        }}
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
          total={data?.pages.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => {
            setLimit(limit);
            setPage(1);
          }}
        />
      </TableWrapper>

      <Modal
        open={isConfirmationDialogOpen}
        size="sm"
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>
            {confirmAction === ConfirmAction.Unpublish ?
              t('pages.panels.unpublishPage')
            : confirmAction === ConfirmAction.Delete ?
              t('pages.panels.deletePage')
            : t('pages.panels.duplicatePage')}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('pages.panels.title')}>
              {currentPage?.latest.title || t('pages.panels.untitled')}
            </DescriptionListItem>

            {currentPage?.latest.description && (
              <DescriptionListItem label={t('pages.panels.lead')}>
                {currentPage?.latest.description}
              </DescriptionListItem>
            )}

            <DescriptionListItem label={t('pages.panels.createdAt')}>
              {currentPage?.createdAt &&
                t('pages.panels.createdAtDate', {
                  createdAtDate: new Date(currentPage.createdAt),
                })}
            </DescriptionListItem>

            <DescriptionListItem label={t('pages.panels.updatedAt')}>
              {currentPage?.modifiedAt &&
                t('pages.panels.updatedAtDate', {
                  updatedAtDate: new Date(currentPage.modifiedAt),
                })}
            </DescriptionListItem>

            {currentPage?.latest.publishedAt && (
              <DescriptionListItem label={t('pages.panels.publishedAt')}>
                {currentPage?.latest.publishedAt &&
                  t('pages.panels.publishedAtDate', {
                    publishedAtDate: new Date(currentPage.latest.publishedAt),
                  })}
              </DescriptionListItem>
            )}
          </DescriptionList>

          <Message
            showIcon
            type="warning"
            title={t('articleEditor.overview.warningLabel')}
          >
            {t('articleEditor.overview.unpublishWarningMessage')}
          </Message>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isUnpublishing || isDeleting || isDuplicating}
            onClick={async () => {
              if (!currentPage) return;

              switch (confirmAction) {
                case ConfirmAction.Delete:
                  await deletePage({
                    variables: { id: currentPage.id },
                    update: cache => {
                      const query = cache.readQuery<PageListQuery>({
                        query: PageListDocument,
                        variables: pageListVariables,
                      });

                      if (!query) return;

                      cache.writeQuery<PageListQuery>({
                        query: PageListDocument,
                        data: {
                          __typename: 'Query',
                          pages: {
                            ...query.pages,
                            nodes: query.pages.nodes.filter(
                              page => page.id !== currentPage.id
                            ),
                          },
                        },
                        variables: pageListVariables,
                      });
                    },
                  });
                  break;

                case ConfirmAction.Unpublish:
                  await unpublishPage({
                    variables: { id: currentPage.id },
                  });
                  setHighlightedRowId(currentPage.id);
                  break;

                case ConfirmAction.Duplicate:
                  duplicatePage({
                    variables: { id: currentPage.id },
                    update: cache => {
                      refetch(pageListVariables);
                      const query = cache.readQuery<PageListQuery>({
                        query: PageListDocument,
                        variables: pageListVariables,
                      });

                      if (!query) return;

                      cache.writeQuery<PageListQuery>({
                        query: PageListDocument,
                        data: {
                          __typename: 'Query',
                          pages: {
                            ...query.pages,
                          },
                        },
                        variables: pageListVariables,
                      });
                    },
                  }).then(output => {
                    if (output.data) {
                      navigate(`/pages/edit/${output.data?.duplicatePage.id}`, {
                        replace: true,
                      });
                    }
                  });
                  break;
              }

              setConfirmationDialogOpen(false);
            }}
            appearance="primary"
          >
            {t('pages.panels.confirm')}
          </Button>
          <Button
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('pages.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PAGES',
  'CAN_GET_PAGE',
  'CAN_CREATE_PAGE',
  'CAN_DELETE_PAGE',
  'CAN_PUBLISH_PAGE',
  CanPreview.id,
])(PageList);
export { CheckedPermissionComponent as PageList };
