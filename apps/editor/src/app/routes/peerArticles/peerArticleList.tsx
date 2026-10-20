import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
} from '@mui/material';
import {
  ArticleSort,
  ImportArticleOptions,
  ImportPeerArticleDocument,
  PeerArticleFilter,
  PeerArticleListDocument,
  SlimPeerArticleFragment,
} from '@wepublish/editor/api';
import { CanGetPeerArticle, CanGetPeerArticles } from '@wepublish/permissions';
import {
  ClickPopover,
  clearFilters,
  countActiveFilters,
  createCheckedPermissionComponent,
  DataTable,
  enqueueSnackbar,
  humanizeError,
  InfoTooltip,
  ListFilters,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  Pagination,
  PeerAvatar,
  TableWrapper,
  useListViewState,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const HeaderInfo = styled.span`
  display: inline-flex;
  margin-left: 4px;
`;

const Img = styled.img`
  height: 25px;
  width: auto;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
`;

const PopoverImg = styled.img`
  height: 175px;
  width: auto;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
`;

const CheckboxGroup = styled.div`
  display: grid;
  gap: 8px;

  .rs-checkbox {
    margin-left: -10px;
  }
`;

const PEER_ARTICLE_FILTER_FIELDS = [
  'title',
  'preTitle',
  'lead',
  'peerId',
  'publicationDate',
] as const;

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
          <PageTitle>{t('peerArticles.peerArticles')}</PageTitle>
          <InfoTooltip text={t('peerArticles.info')} />
        </ListViewHeader>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          filters={
            <ListFilters
              fields={PEER_ARTICLE_FILTER_FIELDS}
              filter={filter}
              isLoading={isLoading}
              onSetFilter={f => {
                setFilter(f);
                setPage(1);
              }}
            />
          }
          filterCount={countActiveFilters(PEER_ARTICLE_FILTER_FIELDS, filter)}
          onResetFilters={() =>
            setFilter(clearFilters(PEER_ARTICLE_FILTER_FIELDS, filter))
          }
          storageKey="peer-articles"
          data={peerArticles ?? []}
          loading={isLoading}
          sortColumn={sortField}
          sortOrder={sortOrder}
          onSort={(sortColumn, sortType) => {
            setSort(sortColumn, sortType);
            setPage(1);
          }}
          sortable={['publishedAt']}
          columns={[
            {
              id: 'title',
              alwaysVisible: true,
              label: t('peerArticles.title'),
              width: 200,
              align: 'left',
              render: (rowData: SlimPeerArticleFragment) => (
                <a
                  href={rowData.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {rowData.latest.title || t('articles.overview.untitled')}
                </a>
              ),
            },
            {
              id: 'lead',
              label: t('peerArticles.lead'),
              width: 200,
              align: 'left',
              render: (rowData: SlimPeerArticleFragment) =>
                rowData.latest.lead || t('articles.overview.untitled'),
            },
            {
              id: 'publishedat',
              label: t('peerArticles.publishedAt'),
              width: 200,
              align: 'left',
              sortKey: 'publishedAt',
              render: (rowData: SlimPeerArticleFragment) =>
                t('peerArticles.publicationDate', {
                  publicationDate: new Date(rowData.publishedAt),
                }),
            },
            {
              id: 'peer',
              label: (
                <>
                  {t('peerArticles.peer')}
                  <HeaderInfo>
                    <InfoTooltip text={t('peerArticles.peerInfo')} />
                  </HeaderInfo>
                </>
              ),
              width: 150,
              align: 'left',
              sortKey: 'peer',
              render: (rowData: SlimPeerArticleFragment) => (
                <PeerAvatar peer={rowData.peer}>
                  <div>{rowData.peer?.name}</div>
                </PeerAvatar>
              ),
            },
            {
              id: 'articleimage',
              label: t('peerArticles.articleImage'),
              width: 120,
              align: 'left',
              render: (rowData: SlimPeerArticleFragment) =>
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
                : '',
            },
            {
              id: 'action',
              label: t('action'),
              width: 120,
              align: 'center',
              fixed: true,
              render: (rowData: SlimPeerArticleFragment) => (
                <Button
                  variant="contained"
                  size="small"
                  type="submit"
                  disabled={!rowData.peer?.id}
                  onClick={() => {
                    const peerId = rowData.peer?.id;

                    if (peerId) {
                      setArticleToImport({ articleId: rowData.id, peerId });
                    }
                  }}
                >
                  {t('peerArticles.import.import')}
                </Button>
              ),
            },
          ]}
        />

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit,
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
            <Box sx={{ marginBottom: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!importArticleOptions.importAuthors}
                    onChange={(_event, checked) => {
                      setImportArticleOptions({
                        ...importArticleOptions,
                        importAuthors: checked,
                      });
                    }}
                  />
                }
                label={t('peerArticles.import.includeAuthors')}
              />

              <FormHelperText>
                {t('peerArticles.import.includeAuthorsHint')}
              </FormHelperText>
            </Box>

            <Box sx={{ marginBottom: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!importArticleOptions.importTags}
                    onChange={(_event, checked) => {
                      setImportArticleOptions({
                        ...importArticleOptions,
                        importTags: checked,
                      });
                    }}
                  />
                }
                label={t('peerArticles.import.includeTags')}
              />

              <FormHelperText>
                {t('peerArticles.import.includeTagsHint')}
              </FormHelperText>
            </Box>

            <Box sx={{ marginBottom: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!importArticleOptions.importContentImages}
                    onChange={(_event, checked) => {
                      setImportArticleOptions({
                        ...importArticleOptions,
                        importContentImages: checked,
                      });
                    }}
                  />
                }
                label={t('peerArticles.import.includeImages')}
              />

              <FormHelperText>
                {t('peerArticles.import.includeImagesHint')}
              </FormHelperText>
            </Box>
          </CheckboxGroup>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setArticleToImport(undefined)}
            disabled={importingInProgress}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              if (!articleToImport) {
                return;
              }

              importPeerArticle({
                variables: {
                  articleId: articleToImport.articleId,
                  peerId: articleToImport.peerId,
                  options: importArticleOptions,
                },
              });
            }}
            disabled={importingInProgress}
          >
            {t('peerArticles.import.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPeerArticles.id,
  CanGetPeerArticle.id,
])(PeerArticleList);
export { CheckedPermissionComponent as PeerArticleList };
