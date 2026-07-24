import {
  ArticleFilter,
  ArticleListDocument,
  ArticleListQuery,
  ArticleSort,
  CommentItemType,
  FullArticleFragment,
  TagType,
  useArticleListQuery,
  useCreateCommentMutation,
  useDeleteArticleMutation,
  useDuplicateArticleMutation,
  useUnpublishArticleMutation,
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
  PeerAvatar,
  PermissionControl,
  StatusBadge,
  Table,
  TableWrapper,
  useColumnConfig,
  useListViewState,
} from '@wepublish/ui/editor';
import { ReactNode, useEffect, useMemo, useState } from 'react';
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

const { Column, HeaderCell, Cell } = RTable;

interface State {
  state: string;
  text: string;
}

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish',
  Duplicate = 'duplicate',
}

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

type ArticleColumn = {
  id: string;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  dataKey?: string;
  alwaysVisible?: boolean;
  render: (article: FullArticleFragment) => ReactNode;
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

  const [deleteArticle, { loading: isDeleting }] = useDeleteArticleMutation({});
  const [unpublishArticle, { loading: isUnpublishing }] =
    useUnpublishArticleMutation();
  const [duplicateArticle, { loading: isDuplicating }] =
    useDuplicateArticleMutation();

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
  } = useArticleListQuery({
    variables: articleListVariables,
  });
  const [createComment] = useCreateCommentMutation();

  const articles = useMemo(() => data?.articles?.nodes ?? [], [data]);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  useEffect(() => {
    const timerID = setTimeout(() => {
      setHighlightedRowId(null);
    }, 3000);

    return () => clearTimeout(timerID);
  }, [highlightedRowId]);

  const dataColumns = useMemo<ArticleColumn[]>(
    () => [
      {
        id: 'states',
        label: t('articles.overview.states'),
        width: 125,
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
        id: 'authors',
        label: t('articles.overview.authors'),
        width: 200,
        render: article =>
          article.latest.authors.reduce(
            (allAuthors, author, index) =>
              `${allAuthors}${index !== 0 ? ', ' : ''}${author?.name}`,
            ''
          ),
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

  const { isVisible, toggle } = useColumnConfig('articles', dataColumns);

  const configurableColumns = useMemo(
    () =>
      dataColumns
        .filter(column => !column.alwaysVisible)
        .map(({ id, label }) => ({ id, label })),
    [dataColumns]
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('articles.overview.articles')}</h2>

          <ColumnConfigurator
            columns={configurableColumns}
            isVisible={isVisible}
            onToggle={toggle}
          />
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={['CAN_CREATE_ARTICLE']}>
          <ListViewActions>
            <Link to="/articles/create">
              <IconButton
                appearance="primary"
                disabled={isLoading}
                icon={<MdAdd />}
              >
                {t('articles.overview.newArticle')}
              </IconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>

        <ListFilters
          fields={[
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
          ]}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => {
            setFilter(filter);
            setPage(1);
          }}
          tagType={TagType.Article}
        />
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={isLoading}
          data={articles}
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
          {dataColumns
            .filter(column => column.alwaysVisible || isVisible(column.id))
            .map(column => (
              <Column
                key={column.id}
                width={column.width}
                align={column.align ?? 'left'}
                resizable
                sortable={column.sortable}
              >
                <HeaderCell>{column.label}</HeaderCell>
                <Cell dataKey={column.dataKey}>
                  {(rowData: FullArticleFragment) => column.render(rowData)}
                </Cell>
              </Column>
            ))}

          <Column
            width={220}
            align="center"
            fixed="right"
          >
            <HeaderCell>{t('articles.overview.action')}</HeaderCell>
            <IconButtonCell>
              {(rowData: FullArticleFragment) => (
                <>
                  <PermissionControl
                    qualifyingPermissions={['CAN_PUBLISH_ARTICLE']}
                  >
                    <IconButtonTooltip
                      caption={t('articleEditor.overview.unpublish')}
                    >
                      <IconButton
                        icon={<MdUnpublished />}
                        circle
                        disabled={!(rowData.published || rowData.pending)}
                        size="sm"
                        onClick={e => {
                          setCurrentArticle(rowData as FullArticleFragment);
                          setConfirmAction(ConfirmAction.Unpublish);
                          setConfirmationDialogOpen(true);
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={['CAN_CREATE_ARTICLE']}
                  >
                    <IconButtonTooltip
                      caption={t('articleEditor.overview.duplicate')}
                    >
                      <IconButton
                        icon={<MdContentCopy />}
                        circle
                        size="sm"
                        onClick={() => {
                          setCurrentArticle(rowData as FullArticleFragment);
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
                      caption={t('articleEditor.overview.createComment')}
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
                    qualifyingPermissions={['CAN_DELETE_ARTICLE']}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        icon={<MdDelete />}
                        circle
                        size="sm"
                        appearance="ghost"
                        color="red"
                        onClick={() => {
                          setCurrentArticle(rowData as FullArticleFragment);
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
          total={data?.articles.totalCount ?? 0}
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
              t('articles.panels.unpublishArticle')
            : confirmAction === ConfirmAction.Delete ?
              t('articles.panels.deleteArticle')
            : t('articles.panels.duplicateArticle')}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
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
            appearance="primary"
            disabled={isUnpublishing || isDeleting || isDuplicating}
            onClick={async () => {
              if (!currentArticle) return;

              switch (confirmAction) {
                case ConfirmAction.Delete:
                  await deleteArticle({
                    variables: { id: currentArticle.id },
                    update: cache => {
                      const query = cache.readQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        variables: articleListVariables,
                      });

                      if (!query) return;

                      cache.writeQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        data: {
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

                      if (!query) return;
                      cache.writeQuery<ArticleListQuery>({
                        query: ArticleListDocument,
                        data: {
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
          <Button
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('articles.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_ARTICLES',
  'CAN_GET_ARTICLE',
  'CAN_CREATE_ARTICLE',
  'CAN_DELETE_ARTICLE',
  CanPreview.id,
])(ArticleList);
export { CheckedPermissionComponent as ArticleList };
