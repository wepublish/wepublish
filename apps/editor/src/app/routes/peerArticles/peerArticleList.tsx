import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  ArticleSort,
  ImportArticleOptions,
  ImportPeerArticleDocument,
  PeerArticleFilter,
  PeerArticleListDocument,
  SlimPeerArticleFragment,
} from '@wepublish/editor/api';
import {
  ClickPopover,
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  InfoTooltip,
  ListFilters,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  Pagination,
  PeerAvatar,
  Table,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Checkbox, Form, Table as RTable } from 'rsuite';

const { Column, HeaderCell, Cell } = RTable;

const HeaderInfo = styled.span`
  display: inline-flex;
  margin-left: 4px;
`;

const Img = styled.img`
  height: 25px;
  width: auto;
  border-radius: var(--rs-radius-md);
`;

const PopoverImg = styled.img`
  height: 175px;
  width: auto;
  border-radius: var(--rs-radius-md);
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

  const { filter, setFilter, sortField, sortOrder, setSort, limit, setLimit } =
    useListViewState<PeerArticleFilter>('peerArticles', {
      defaultSortField: 'publishedAt',
    });

  const [page, setPage] = useState(1);
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
    useMutation(ImportPeerArticleDocument, {
      onCompleted(data) {
        enqueueSnackbar(t('toast.createdSuccess'), {
          variant: 'success',
          autoHideDuration: 3000,
        });

        navigate(`/articles/edit/${data.importPeerArticle.id}`);
      },
    });

  const {
    data: peerArticleListData,
    loading: isLoading,
    error: peerArticleListError,
  } = useQuery(PeerArticleListDocument, {
    variables: listVariables,
  });

  useEffect(() => {
    if (peerArticleListError) {
      enqueueSnackbar(humanizeError(peerArticleListError), {
        variant: 'error',
        autoHideDuration: null,
      });
    }
  }, [peerArticleListError]);

  const peerArticles = peerArticleListData?.peerArticles.nodes;

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('peerArticles.peerArticles')}</h2>
          <InfoTooltip text={t('peerArticles.info')} />
        </ListViewHeader>

        <ListFilters
          fields={['title', 'preTitle', 'lead', 'peerId', 'publicationDate']}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={f => {
            setFilter(f);
            setPage(1);
          }}
        />
      </ListViewContainer>

      <TableWrapper>
        <Table
          onSortColumn={(sortColumn, sortType) => {
            setSort(sortColumn, sortType ?? 'asc');
            setPage(1);
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
              {(rowData: SlimPeerArticleFragment) => (
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
              {(rowData: SlimPeerArticleFragment) =>
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
              {(rowData: SlimPeerArticleFragment) =>
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
            <HeaderCell>
              {t('peerArticles.peer')}
              <HeaderInfo>
                <InfoTooltip text={t('peerArticles.peerInfo')} />
              </HeaderInfo>
            </HeaderCell>
            <Cell dataKey="peer">
              {(rowData: SlimPeerArticleFragment) => (
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
              {(rowData: SlimPeerArticleFragment) =>
                rowData.latest.image?.url ?
                  <ClickPopover
                    trigger={
                      <Img
                        src={rowData.latest.image?.url || ''}
                        alt=""
                      />
                    }
                    anchorOrigin={{ vertical: 'center', horizontal: 'left' }}
                    transformOrigin={{
                      vertical: 'center',
                      horizontal: 'right',
                    }}
                  >
                    <PopoverImg
                      src={rowData.latest.image?.url || ''}
                      alt=""
                    />
                  </ClickPopover>
                : ''
              }
            </Cell>
          </Column>

          <Column
            width={120}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <Cell>
              {(rowData: SlimPeerArticleFragment) => (
                <Button
                  variant="contained"
                  size="small"
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
          state={{
            page,
            limit,
            setPage,
            setLimit: limit => {
              setLimit(limit);
              setPage(1);
            },
          }}
          totalCount={peerArticleListData?.peerArticles?.totalCount ?? 0}
        />
      </TableWrapper>

      <Dialog
        open={!!articleToImport}
        onClose={() => setArticleToImport(undefined)}
        slotProps={{ transition: { onExited: () => reset() } }}
      >
        <DialogTitle>{t('peerArticles.import.title')}</DialogTitle>

        <DialogContent>
          {error && <Alert severity="error">{humanizeError(error)}</Alert>}

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

              <Form.Text>
                {t('peerArticles.import.includeAuthorsHint')}
              </Form.Text>
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

              <Form.Text>{t('peerArticles.import.includeTagsHint')}</Form.Text>
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

              <Form.Text>
                {t('peerArticles.import.includeImagesHint')}
              </Form.Text>
            </Form.Group>
          </CheckboxGroup>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
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
          >
            {t('peerArticles.import.confirm')}
          </Button>

          <Button
            variant="text"
            onClick={() => setArticleToImport(undefined)}
            disabled={importingInProgress}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PEER_ARTICLES',
  'CAN_GET_PEER_ARTICLE',
])(PeerArticleList);
export { CheckedPermissionComponent as PeerArticleList };
