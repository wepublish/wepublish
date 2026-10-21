import { useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  AlertTitle,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
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
import {
  CanCreatePage,
  CanDeletePage,
  CanGetPage,
  CanGetPages,
  CanPreview,
  CanPublishPage,
  CanUpdateComments,
} from '@wepublish/permissions';
import {
  clearFilters,
  countActiveFilters,
  createCheckedPermissionComponent,
  DataTable,
  DescriptionList,
  DescriptionListItem,
  IconButton,
  IconButtonTooltip,
  Link,
  ListColumn,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  Pagination,
  PermissionControl,
  StatusBadge,
  TableWrapper,
  useListViewState,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdComment,
  MdContentCopy,
  MdDelete,
  MdLink,
  MdUnpublished,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { copyLinkToClipboard } from '../../copyLink';

import { CreatePageModal } from './createPageModal';

interface State {
  state: string;
  text: string;
}

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish',
  Duplicate = 'duplicate',
}

const PAGE_FILTER_FIELDS = [
  'title',
  'description',
  'slug',
  'draft',
  'pending',
  'published',
  'publicationDate',
  'includeHidden',
] as const;

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
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
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

  type PageRow = (typeof pages)[number];

  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  useEffect(() => {
    const timerID = setTimeout(() => {
      setHighlightedRowId(null);
    }, 3000);
    return () => {
      clearTimeout(timerID);
    };
  }, [highlightedRowId]);

  const [createComment] = useMutation(CreateCommentDocument, {});

  const dataColumns = useMemo<ListColumn<PageRow>[]>(
    () => [
      {
        id: 'states',
        label: t('pages.overview.states'),
        width: 150,
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
        id: 'description',
        label: t('pageEditor.panels.description'),
        width: 250,
        render: page => page.latest.description,
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
        render: page =>
          t('pageEditor.overview.modifiedAt', {
            modificationDate: new Date(page.modifiedAt),
          }),
      },
    ],
    [t]
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('pages.overview.pages')}</PageTitle>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[CanCreatePage.id]}>
          <ListViewActions>
            <Button
              disabled={isLoading}
              onClick={() => setCreateModalOpen(true)}
              variant="contained"
              startIcon={<MdAdd />}
            >
              {t('pages.overview.newPage')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          filters={
            <ListFilters
              fields={PAGE_FILTER_FIELDS}
              filter={filter}
              isLoading={isLoading}
              onSetFilter={filter => {
                setFilter(filter);
                setPage(1);
              }}
              tagType={TagType.Page}
            />
          }
          filterCount={countActiveFilters(PAGE_FILTER_FIELDS, filter)}
          onResetFilters={() =>
            setFilter(clearFilters(PAGE_FILTER_FIELDS, filter))
          }
          loading={isLoading}
          data={pages}
          sortColumn={sortField}
          sortOrder={sortOrder}
          sortable={dataColumns
            .filter(column => column.sortable)
            .map(column => column.dataKey ?? column.id)}
          onSort={(column, order) => {
            setSort(column, order);
            setPage(1);
          }}
          rowClassName={rowData =>
            rowData?.id === highlightedRowId ? 'highlighted-row' : ''
          }
          storageKey="pages"
          columns={[
            ...dataColumns.map(column => ({
              ...column,
              sortKey: column.dataKey,
              resizable: column.resizable ?? true,
            })),
            {
              id: 'action',
              label: t('action'),
              width: 260,
              align: 'center',
              fixed: true,
              render: rowData => (
                <>
                  <IconButtonTooltip caption={t('copyLink.button')}>
                    <IconButton
                      aria-label={t('copyLink.button')}
                      disabled={!rowData.published}
                      size="small"
                      onClick={() => copyLinkToClipboard(rowData.url, t)}
                    >
                      <MdLink />
                    </IconButton>
                  </IconButtonTooltip>

                  <PermissionControl
                    qualifyingPermissions={[CanPublishPage.id]}
                  >
                    <IconButtonTooltip
                      caption={t('pageEditor.overview.unpublish')}
                    >
                      <IconButton
                        aria-label={t('pageEditor.overview.unpublish')}
                        disabled={!(rowData.published || rowData.pending)}
                        size="small"
                        onClick={e => {
                          setCurrentPage(rowData as FullPageFragment);
                          setConfirmAction(ConfirmAction.Unpublish);
                          setConfirmationDialogOpen(true);
                        }}
                      >
                        <MdUnpublished />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl qualifyingPermissions={[CanCreatePage.id]}>
                    <IconButtonTooltip
                      caption={t('pageEditor.overview.duplicate')}
                    >
                      <IconButton
                        aria-label={t('pageEditor.overview.duplicate')}
                        size="small"
                        onClick={() => {
                          setCurrentPage(rowData as FullPageFragment);
                          setConfirmAction(ConfirmAction.Duplicate);
                          setConfirmationDialogOpen(true);
                        }}
                      >
                        <MdContentCopy />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[CanUpdateComments.id]}
                  >
                    <IconButtonTooltip
                      caption={t('pageEditor.overview.createComment')}
                    >
                      <IconButton
                        aria-label={t('pageEditor.overview.createComment')}
                        size="small"
                        onClick={() => {
                          createComment({
                            variables: {
                              itemID: rowData.id,
                              itemType: CommentItemType.Page,
                            },
                            onCompleted(data) {
                              navigate(
                                `/comments/edit/${data?.createComment.id}`
                              );
                            },
                          });
                        }}
                      >
                        <MdComment />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl qualifyingPermissions={[CanDeletePage.id]}>
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        aria-label={t('delete')}
                        size="small"
                        color="error"
                        onClick={() => {
                          setCurrentPage(rowData as FullPageFragment);
                          setConfirmAction(ConfirmAction.Delete);
                          setConfirmationDialogOpen(true);
                        }}
                      >
                        <MdDelete />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                </>
              ),
            },
          ]}
        />

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit: limit => {
              setLimit(limit);
              setPage(1);
            },
          }}
          totalCount={data?.pages.totalCount ?? 0}
        />
      </TableWrapper>

      <Dialog
        fullWidth
        open={isConfirmationDialogOpen}
        maxWidth="sm"
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>
          {confirmAction === ConfirmAction.Unpublish ?
            t('pages.panels.unpublishPage')
          : confirmAction === ConfirmAction.Delete ?
            t('pages.panels.deletePage')
          : t('pages.panels.duplicatePage')}
        </DialogTitle>

        <DialogContent>
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

          <Alert severity="warning">
            <AlertTitle>{t('articleEditor.overview.warningLabel')}</AlertTitle>
            {t('articleEditor.overview.unpublishWarningMessage')}
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('pages.panels.cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isUnpublishing || isDeleting || isDuplicating}
            onClick={async () => {
              if (!currentPage) {
                return;
              }

              switch (confirmAction) {
                case ConfirmAction.Delete:
                  await deletePage({
                    variables: { id: currentPage.id },
                    update: cache => {
                      const query = cache.readQuery<PageListQuery>({
                        query: PageListDocument,
                        variables: pageListVariables,
                      });

                      if (!query) {
                        return;
                      }

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

                      if (!query) {
                        return;
                      }

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
          >
            {t('pages.panels.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <CreatePageModal
        open={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPages.id,
  CanGetPage.id,
  CanCreatePage.id,
  CanDeletePage.id,
  CanPublishPage.id,
  CanPreview.id,
])(PageList);
export { CheckedPermissionComponent as PageList };
