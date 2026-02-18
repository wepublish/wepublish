import styled from '@emotion/styled';
import {
  ArticleSort,
  ImportArticleOptions,
  PeerArticle,
  PeerArticleFilter,
  useImportPeerArticleMutation,
  usePeerArticleListQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  ListFilters,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PeerAvatar,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Form,
  Message,
  Modal,
  Pagination,
  Popover,
  Table as RTable,
  toaster,
  Whisper,
} from 'rsuite';

const { Column, HeaderCell, Cell } = RTable;

const Img = styled.img`
  height: 25px;
  width: auto;
`;

const PopoverImg = styled.img`
  height: 175px;
  width: auto;
`;

const CheckboxGroup = styled.div`
  display: grid;
  gap: 8px;

  .rs-checkbox {
    margin-left: -10px;
  }
`;

function mapColumFieldToGraphQLField(columnField: string): ArticleSort | null {
  switch (columnField) {
    case 'publishedAt':
      return ArticleSort.PublishedAt;
    case 'modifiedAt':
      return ArticleSort.ModifiedAt;
    default:
      return null;
  }
}

function PeerArticleList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState('publishedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<PeerArticleFilter>({});
  const [articleToImport, setArticleToImport] = useState<{
    peerId: string;
    articleId: string;
  }>();
  const [importArticleOptions, setImportArticleOptions] =
    useState<ImportArticleOptions>({
      importAuthors: true,
      importContentImages: true,
      importTags: true,
    });

  const listVariables = useMemo(
    () => ({
      filter,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    }),
    [filter, limit, page, sortField, sortOrder]
  );

  const [importPeerArticle, { loading: importingInProgress, error, reset }] =
    useImportPeerArticleMutation({
      onCompleted(data) {
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
          >
            {t('toast.createdSuccess')}
          </Message>,
          { duration: 3000 }
        );

        navigate(`/articles/edit/${data.importPeerArticle.id}`);
      },
    });

  const { data: peerArticleListData, loading: isLoading } =
    usePeerArticleListQuery({
      variables: listVariables,
      fetchPolicy: 'cache-and-network',
      onError(error) {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
          >
            {error.message}
          </Message>,
          { duration: 0 }
        );
      },
    });

  const peerArticles = peerArticleListData?.peerArticles.nodes;

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('peerArticles.peerArticles')}</h2>
        </ListViewHeader>

        <ListFilters
          fields={['title', 'preTitle', 'lead', 'peerId', 'publicationDate']}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={setFilter}
        />
      </ListViewContainer>

      <TableWrapper>
        <Table
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc');
            setSortField(sortColumn);
          }}
          fillHeight
          loading={isLoading}
          data={peerArticles}
          sortColumn={sortField}
          sortType={sortOrder}
        >
          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('peerArticles.title')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) => (
                <a
                  href={rowData.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {rowData.latest.title || t('articles.overview.untitled')}
                </a>
              )}
            </Cell>
          </Column>

          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('peerArticles.lead')}</HeaderCell>
            <Cell>
              {(rowData: PeerArticle) =>
                rowData.latest.lead || t('articles.overview.untitled')
              }
            </Cell>
          </Column>

          <Column
            width={200}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('peerArticles.publishedAt')}</HeaderCell>
            <Cell dataKey="publishedAt">
              {(rowData: PeerArticle) =>
                t('peerArticles.publicationDate', {
                  publicationDate: new Date(rowData.publishedAt),
                })
              }
            </Cell>
          </Column>

          <Column
            width={150}
            align="left"
            resizable
          >
            <HeaderCell>{t('peerArticles.peer')}</HeaderCell>
            <Cell dataKey="peer">
              {(rowData: PeerArticle) => (
                <PeerAvatar peer={rowData.peer}>
                  <div>{rowData.peer?.name}</div>
                </PeerAvatar>
              )}
            </Cell>
          </Column>

          <Column
            width={120}
            align="left"
            resizable
          >
            <HeaderCell>{t('peerArticles.articleImage')}</HeaderCell>

            <Cell>
              {(rowData: PeerArticle) =>
                rowData.latest.image?.url ?
                  <Whisper
                    placement="left"
                    trigger="hover"
                    controlId="control-id-hover"
                    speaker={
                      <Popover>
                        <PopoverImg
                          src={rowData.latest.image?.url || ''}
                          alt=""
                        />
                      </Popover>
                    }
                  >
                    <Img
                      src={rowData.latest.image?.url || ''}
                      alt=""
                    />
                  </Whisper>
                : ''
              }
            </Cell>
          </Column>

          <Column
            width={120}
            align="right"
          >
            <HeaderCell></HeaderCell>
            <Cell>
              {(rowData: PeerArticle) => (
                <Button
                  appearance="primary"
                  size="xs"
                  type="submit"
                  disabled={!rowData.peer?.id}
                  onClick={() => {
                    setArticleToImport({
                      articleId: rowData.id,
                      peerId: rowData.peer!.id,
                    });
                  }}
                >
                  {t('peerArticles.import.import')}
                </Button>
              )}
            </Cell>
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
          total={peerArticleListData?.peerArticles?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </TableWrapper>

      <Modal
        open={!!articleToImport}
        onClose={() => setArticleToImport(undefined)}
        onExited={() => reset()}
      >
        <Modal.Header>
          <Modal.Title>{t('peerArticles.import.title')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <Message
              type="error"
              showIcon
              closable
            >
              {error.message}
            </Message>
          )}

          <CheckboxGroup>
            <Form.Group>
              <Checkbox
                checked={!!importArticleOptions.importAuthors}
                onChange={(value, checked) => {
                  setImportArticleOptions({
                    ...importArticleOptions,
                    importAuthors: checked,
                  });
                }}
              >
                {t('peerArticles.import.includeAuthors')}
              </Checkbox>

              <Form.HelpText>
                {t('peerArticles.import.includeAuthorsHint')}
              </Form.HelpText>
            </Form.Group>

            <Form.Group>
              <Checkbox
                checked={!!importArticleOptions.importTags}
                onChange={(value, checked) => {
                  setImportArticleOptions({
                    ...importArticleOptions,
                    importTags: checked,
                  });
                }}
              >
                {t('peerArticles.import.includeTags')}
              </Checkbox>

              <Form.HelpText>
                {t('peerArticles.import.includeTagsHint')}
              </Form.HelpText>
            </Form.Group>

            <Form.Group>
              <Checkbox
                checked={!!importArticleOptions.importContentImages}
                onChange={(value, checked) => {
                  setImportArticleOptions({
                    ...importArticleOptions,
                    importContentImages: checked,
                  });
                }}
              >
                {t('peerArticles.import.includeImages')}
              </Checkbox>

              <Form.HelpText>
                {t('peerArticles.import.includeImagesHint')}
              </Form.HelpText>
            </Form.Group>
          </CheckboxGroup>
        </Modal.Body>

        <Modal.Footer>
          <Button
            onClick={() => {
              importPeerArticle({
                variables: {
                  articleId: articleToImport!.articleId,
                  peerId: articleToImport!.peerId,
                  options: importArticleOptions,
                },
              });
            }}
            disabled={importingInProgress}
            appearance="primary"
          >
            {t('peerArticles.import.confirm')}
          </Button>

          <Button
            onClick={() => setArticleToImport(undefined)}
            disabled={importingInProgress}
            appearance="subtle"
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PEER_ARTICLES',
  'CAN_GET_PEER_ARTICLE',
])(PeerArticleList);
export { CheckedPermissionComponent as PeerArticleList };
