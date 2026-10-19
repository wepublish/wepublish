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
  ArticleFilter,
  ArticleListDocument,
  ArticleListQuery,
  ArticleSort,
  CommentItemType,
  CreateCommentDocument,
  DeleteArticleDocument,
  DuplicateArticleDocument,
  FullArticleFragment,
  TagType,
  UnpublishArticleDocument,
} from '@wepublish/editor/api';
import {
  CanCreateArticle,
  CanDeleteArticle,
  CanGetArticle,
  CanGetArticles,
  CanPreview,
  CanPublishArticle,
  CanUpdateComments,
} from '@wepublish/permissions';
import {
  clearFilters,
  countActiveFilters,
  createCheckedPermissionComponent,
  DataTable,
  DescriptionList,
  DescriptionListItem,
  formatArticleAuthors,
  IconButton,
  IconButtonTooltip,
  Link,
  ListColumn,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PageTitle,
  Pagination,
  PeerAvatar,
  PermissionControl,
  StatusBadge,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdAddComment,
  MdContentCopy,
  MdDelete,
  MdLink,
  MdUnpublished,
} from 'react-icons/md';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { copyLinkToClipboard } from '../../copyLink';

interface State {
  state: string;
  text: string;
}

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish',
  Duplicate = 'duplicate',
}

const ARTICLE_FILTER_FIELDS = [
  'title',
  'preTitle',
  'lead',
  'draft',
  'authors',
  'tags',
  'pending',
  'published',
  'publicationDate',
  'includeHidden',
  'peerId',
] as const;

function mapColumFieldToGraphQLField(columnField: string): ArticleSort | null {
  switch (columnField) {
    case 'createdAt':
      return ArticleSort.CreatedAt;
    case 'modifiedAt':
      return ArticleSort.ModifiedAt;
    case 'publishedAt':
      return ArticleSort.PublishedAt;
    default:
      return null;
  }
}

type ArticleListProps = {
  initialFilter?: ArticleFilter;
};

function ArticleList({ initialFilter = {} }: ArticleListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { filter, setFilter, sortField, sortOrder, setSort, limit, setLimit } =
    useListViewState<ArticleFilter>('articles', {
      defaultFilter: initialFilter,
    });

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<FullArticleFragment>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>();

  const [page, setPage] = useState(1);

  const [deleteArticle, { loading: isDeleting }] = useMutation(
    DeleteArticleDocument,
    {}
  );
  const [unpublishArticle, { loading: isUnpublishing }] = useMutation(
    UnpublishArticleDocument
  );
  const [duplicateArticle, { loading: isDuplicating }] = useMutation(
    DuplicateArticleDocument
  );

  const articleListVariables = useMemo(
    () => ({
      filter,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    }),
    [filter, limit, page, sortField, sortOrder]
  );

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(ArticleListDocument, {
    variables: articleListVariables,
  });
  const [createComment] = useMutation(CreateCommentDocument);

  const articles = useMemo(() => data?.articles?.nodes ?? [], [data]);

  type ArticleRow = (typeof articles)[number];
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  useEffect(() => {
    const timerID = setTimeout(() => {
      setHighlightedRowId(null);
    }, 3000);

    return () => clearTimeout(timerID);
  }, [highlightedRowId]);

  const dataColumns = useMemo<ListColumn<ArticleRow>[]>(
    () => [
      {
        id: 'states',
        label: t('articles.overview.states'),
        width: 150,
        resizable: false,
        alwaysVisible: true,
        render: article => {
          const states: State[] = [];

          if (article.draft) {
            states.push({ state: 'draft', text: t('articles.overview.draft') });
          }

          if (article.pending) {
            states.push({
              state: 'pending',
              text: t('articles.overview.pending'),
            });
          }

          if (article.published) {
            states.push({
              state: 'published',
              text: t('articles.overview.published'),
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
        id: 'preTitle',
        label: t('articles.overview.preTitle'),
        width: 250,
        render: article => article.latest.preTitle,
      },
      {
        id: 'title',
        label: t('articles.overview.title'),
        width: 400,
        alwaysVisible: true,
        render: article => (
          <PeerAvatar peer={article.peer}>
            <Link to={`/articles/edit/${article.id}`}>
              {article.latest.title || t('articles.overview.untitled')}
            </Link>
          </PeerAvatar>
        ),
      },
      {
        id: 'slug',
        label: t('articles.overview.slug'),
        width: 210,
        render: article => article.slug,
      },
      {
        id: 'authors',
        label: t('articles.overview.authors'),
        width: 200,
        render: article => formatArticleAuthors(article.latest.authors),
      },
      {
        id: 'publicationDate',
        label: t('articles.overview.publicationDate'),
        width: 210,
        sortable: true,
        dataKey: 'publishedAt',
        render: article =>
          article.published?.publishedAt ?
            t('articleEditor.overview.publishedAt', {
              publicationDate: new Date(article.published.publishedAt),
            })
          : article.pending?.publishedAt ?
            t('articleEditor.overview.publishedAtIfPending', {
              publishedAtIfPending: new Date(article.pending.publishedAt),
            })
          : t('articles.overview.notPublished'),
      },
      {
        id: 'updated',
        label: t('articles.overview.updated'),
        width: 210,
        sortable: true,
        dataKey: 'modifiedAt',
        render: article =>
          t('articleEditor.overview.modifiedAt', {
            modificationDate: new Date(article.modifiedAt),
          }),
      },
    ],
    [t]
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('articles.overview.articles')}</PageTitle>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[CanCreateArticle.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/articles/create"
              variant="contained"
              startIcon={<MdAdd />}
            >
              {t('articles.overview.newArticle')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          filters={
            <ListFilters
              fields={ARTICLE_FILTER_FIELDS}
              filter={filter}
              isLoading={isLoading}
              onSetFilter={filter => {
                setFilter(filter);
                setPage(1);
              }}
              tagType={TagType.Article}
            />
          }
          filterCount={countActiveFilters(ARTICLE_FILTER_FIELDS, filter)}
          onResetFilters={() =>
            setFilter(clearFilters(ARTICLE_FILTER_FIELDS, filter))
          }
          loading={isLoading}
          data={articles}
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
          storageKey="articles"
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
                    qualifyingPermissions={[CanPublishArticle.id]}
                  >
                    <IconButtonTooltip
                      caption={t('articleEditor.overview.unpublish')}
                    >
                      <IconButton
                        aria-label={t('articleEditor.overview.unpublish')}
                        disabled={!(rowData.published || rowData.pending)}
                        size="small"
                        onClick={e => {
                          setCurrentArticle(rowData as FullArticleFragment);
                          setConfirmAction(ConfirmAction.Unpublish);
                          setConfirmationDialogOpen(true);
                        }}
                      >
                        <MdUnpublished />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[CanCreateArticle.id]}
                  >
                    <IconButtonTooltip
                      caption={t('articleEditor.overview.duplicate')}
                    >
                      <IconButton
                        aria-label={t('articleEditor.overview.duplicate')}
                        size="small"
                        onClick={() => {
                          setCurrentArticle(rowData as FullArticleFragment);
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
                      caption={t('articleEditor.overview.createComment')}
                    >
                      <IconButton
                        aria-label={t('articleEditor.overview.createComment')}
                        size="small"
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
                      >
                        <MdAddComment />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[CanDeleteArticle.id]}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        aria-label={t('delete')}
                        size="small"
                        color="error"
                        onClick={() => {
                          setCurrentArticle(rowData as FullArticleFragment);
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
          totalCount={data?.articles.totalCount ?? 0}
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
            t('articles.panels.unpublishArticle')
          : confirmAction === ConfirmAction.Delete ?
            t('articles.panels.deleteArticle')
          : t('articles.panels.duplicateArticle')}
        </DialogTitle>

        <DialogContent>
          <DescriptionList>
            <DescriptionListItem label={t('articles.panels.title')}>
              {currentArticle?.latest.title || t('articles.panels.untitled')}
            </DescriptionListItem>

            {currentArticle?.latest.lead && (
              <DescriptionListItem label={t('articles.panels.lead')}>
                {currentArticle?.latest.lead}
              </DescriptionListItem>
            )}

            <DescriptionListItem label={t('articles.panels.createdAt')}>
              {currentArticle?.createdAt &&
                t('articles.panels.createdAtDate', {
                  createdAtDate: new Date(currentArticle.createdAt),
                })}
            </DescriptionListItem>

            <DescriptionListItem label={t('articles.panels.updatedAt')}>
              {currentArticle?.latest.createdAt &&
                t('articles.panels.updatedAtDate', {
                  updatedAtDate: new Date(currentArticle.latest.createdAt),
                })}
            </DescriptionListItem>

            {currentArticle?.latest.publishedAt && (
              <DescriptionListItem label={t('articles.panels.publishedAt')}>
                {t('articles.panels.publishedAtDate', {
                  publishedAtDate: new Date(currentArticle.latest.publishedAt),
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
            {t('articles.panels.cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isUnpublishing || isDeleting || isDuplicating}
            onClick={async () => {
              if (!currentArticle) {
                return;
              }

              switch (confirmAction) {
                case ConfirmAction.Delete:
                  await deleteArticle({
                    variables: { id: currentArticle.id },
                    update: cache => {
                      const query = cache.readQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        variables: articleListVariables,
                      });

                      if (!query) {
                        return;
                      }

                      cache.writeQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        data: {
                          __typename: 'Query',
                          articles: {
                            ...query.articles,
                            nodes: query.articles.nodes.filter(
                              article => article.id !== currentArticle.id
                            ),
                          },
                        },
                        variables: articleListVariables,
                      });
                    },
                  });
                  break;

                case ConfirmAction.Unpublish:
                  await unpublishArticle({
                    variables: { id: currentArticle.id },
                  });
                  setHighlightedRowId(currentArticle.id);
                  break;

                case ConfirmAction.Duplicate:
                  duplicateArticle({
                    variables: { id: currentArticle.id },
                    update: cache => {
                      refetch(articleListVariables);
                      const query = cache.readQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        variables: articleListVariables,
                      });

                      if (!query) {
                        return;
                      }
                      cache.writeQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        data: {
                          __typename: 'Query',
                          articles: {
                            ...query.articles,
                          },
                        },
                        variables: articleListVariables,
                      });
                    },
                  }).then(output => {
                    if (output.data) {
                      navigate(
                        `/articles/edit/${output.data?.duplicateArticle.id}`,
                        {
                          replace: true,
                        }
                      );
                    }
                  });
                  break;
              }

              setConfirmationDialogOpen(false);
            }}
          >
            {t('articles.panels.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetArticles.id,
  CanGetArticle.id,
  CanCreateArticle.id,
  CanDeleteArticle.id,
  CanPreview.id,
])(ArticleList);
export { CheckedPermissionComponent as ArticleList };
