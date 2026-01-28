import {
  CommentItemType,
  TagType,
  useCreateCommentMutation,
} from '@wepublish/editor/api';
import {
  FullPageFragment,
  getApiClientV2,
  PageFilter,
  PageListDocument,
  PageListQuery,
  PageSort,
  useDeletePageMutation,
  useDuplicatePageMutation,
  usePageListQuery,
  useUnpublishPageMutation,
} from '@wepublish/editor/api-v2';
import { CanPreview } from '@wepublish/permissions';
import {
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
import { Button, Message, Modal, Pagination, Table as RTable } from 'rsuite';

interface State {
  state: string;
  text: string;
}

const { Column, HeaderCell, Cell } = RTable;

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

  const [filter, setFilter] = useState({} as PageFilter);

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<FullPageFragment>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState('modifiedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const client = getApiClientV2();
  const [deletePage, { loading: isDeleting }] = useDeletePageMutation({
    client,
  });
  const [unpublishPage, { loading: isUnpublishing }] = useUnpublishPageMutation(
    { client }
  );
  const [duplicatePage, { loading: isDuplicating }] = useDuplicatePageMutation({
    client,
  });

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
  } = usePageListQuery({
    client,
    variables: pageListVariables,
    fetchPolicy: 'cache-and-network',
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

  const [createComment] = useCreateCommentMutation();

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('pages.overview.pages')}</h2>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_PAGE']}>
          <ListViewActions>
            <Link to="/pages/create">
              <IconButton
                appearance="primary"
                disabled={isLoading}
                icon={<MdAdd />}
              >
                {t('pages.overview.newPage')}
              </IconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>

        <ListFilters
          fields={[
            'title',
            'description',
            'draft',
            'pending',
            'published',
            'publicationDate',
            'includeHidden',
          ]}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => setFilter(filter)}
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
            setSortOrder(sortType ?? 'asc');
            setSortField(sortColumn);
          }}
        >
          <Column
            width={125}
            align="left"
            resizable
          >
            <HeaderCell>{t('pages.overview.states')}</HeaderCell>
            <Cell>
              {(rowData: FullPageFragment) => {
                const states: State[] = [];

                if (rowData.draft)
                  states.push({
                    state: 'draft',
                    text: t('pages.overview.draft'),
                  });
                if (rowData.pending)
                  states.push({
                    state: 'pending',
                    text: t('pages.overview.pending'),
                  });
                if (rowData.published)
                  states.push({
                    state: 'published',
                    text: t('pages.overview.published'),
                  });

                return (
                  <StatusBadge states={states.map(st => st.state)}>
                    {states.map(st => st.text).join(' / ')}
                  </StatusBadge>
                );
              }}
            </Cell>
          </Column>

          <Column
            width={400}
            align="left"
            resizable
          >
            <HeaderCell>{t('pages.overview.title')}</HeaderCell>
            <Cell>
              {(rowData: FullPageFragment) => (
                <Link to={`/pages/edit/${rowData.id}`}>
                  {rowData.latest.title || t('pages.overview.untitled')}
                </Link>
              )}
            </Cell>
          </Column>

          <Column
            width={210}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('pages.overview.publicationDate')}</HeaderCell>
            <Cell dataKey="publishedAt">
              {(pageRef: FullPageFragment) =>
                pageRef.published?.publishedAt ?
                  t('pageEditor.overview.publishedAt', {
                    publicationDate: new Date(pageRef.published.publishedAt),
                  })
                : pageRef.pending?.publishedAt ?
                  t('pageEditor.overview.publishedAtIfPending', {
                    publishedAtIfPending: new Date(
                      pageRef.pending?.publishedAt
                    ),
                  })
                : t('pages.overview.notPublished')
              }
            </Cell>
          </Column>

          <Column
            width={210}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('pages.overview.updated')}</HeaderCell>
            <Cell dataKey="modifiedAt">
              {({ modifiedAt }: FullPageFragment) =>
                t('pageEditor.overview.modifiedAt', {
                  modificationDate: new Date(modifiedAt),
                })
              }
            </Cell>
          </Column>

          <Column
            width={220}
            align="center"
            fixed="right"
          >
            <HeaderCell>{t('pages.overview.action')}</HeaderCell>
            <IconButtonCell>
              {(rowData: FullPageFragment) => (
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
                          setCurrentPage(rowData);
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
                          setCurrentPage(rowData);
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
                          setCurrentPage(rowData);
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
          onChangeLimit={limit => setLimit(limit)}
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
