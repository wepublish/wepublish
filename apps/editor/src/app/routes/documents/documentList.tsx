import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
} from '@mui/material';
import {
  DeleteDocumentDocument,
  DocumentListDocument,
  DocumentListQuery,
  DocumentStorageUsageDocument,
  FullDocumentFragment,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DocumentEditPanel,
  DocumentUploadAndEditPanel,
  DRAWER_WIDTHS,
  enqueueSnackbar,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  PaddedCell,
  Pagination,
  PermissionControl,
  Table,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import prettyBytes from 'pretty-bytes';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdContentCopy,
  MdDelete,
  MdEdit,
  MdOpenInNew,
  MdOutlineUploadFile,
  MdSearch,
} from 'react-icons/md';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Input, InputGroup, Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

const Thumbnail = styled.img`
  height: 70px;
  width: auto;
  display: block;
  margin: 0 auto;
  border-radius: var(--rs-radius-md);
`;

function DocumentList() {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { id } = params;

  const isUploadRoute = location.pathname.includes('upload');
  const isEditRoute = location.pathname.includes('edit');

  const [documents, setDocuments] = useState<FullDocumentFragment[]>([]);

  const { filter, setFilter, limit, setLimit } = useListViewState<string>(
    'documents',
    { defaultFilter: '' }
  );

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] =
    useState<FullDocumentFragment>();

  const [activePage, setActivePage] = useState(1);

  const [isUploadModalOpen, setUploadModalOpen] = useState(isUploadRoute);
  const [isEditModalOpen, setEditModalOpen] = useState(isEditRoute);

  const [editID, setEditID] = useState<string | undefined>(
    isEditRoute ? id : undefined
  );

  const listVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (activePage - 1) * limit,
  };

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(DocumentListDocument, {
    variables: listVariables,
  });

  const [deleteDocument, { loading: isDeleting }] = useMutation(
    DeleteDocumentDocument,
    {}
  );

  const {
    data: storageData,
    error: storageError,
    refetch: refetchStorage,
  } = useQuery(DocumentStorageUsageDocument);
  if (storageError) {
    console.error('DocumentStorageUsage query error:', storageError);
  }

  const storage = storageData?.documentStorageUsage;
  const hasLimit = storage && storage.limitBytes > 0;
  const usageRatio = hasLimit ? storage.usedBytes / storage.limitBytes : 0;
  const isOverLimit = hasLimit && usageRatio >= 1;
  const isNearLimit = hasLimit && usageRatio >= 0.95 && !isOverLimit;
  const storageColor =
    isOverLimit ? 'var(--rs-state-error)'
    : isNearLimit ? 'var(--rs-state-warning)'
    : 'var(--rs-text-secondary)';

  const { t } = useTranslation();

  useEffect(() => {
    if (data?.documents?.nodes) {
      setDocuments(data.documents.nodes);
    }
  }, [data?.documents]);

  useEffect(() => {
    refetch(listVariables);
  }, [filter, activePage, limit]);

  useEffect(() => {
    if (isUploadRoute) {
      setUploadModalOpen(true);
    }

    if (isEditRoute) {
      setEditModalOpen(true);
      setEditID(id);
    }
  }, [location]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('documents.overview.documentLibrary')}</h2>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_DOCUMENT']}>
          <ListViewActions>
            {isOverLimit ?
              <Button
                variant="contained"
                startIcon={<MdOutlineUploadFile />}
                disabled
              >
                {t('documents.overview.storageFull')}
              </Button>
            : <Link
                to="/documents/upload"
                state={{ modalLocation: location }}
              >
                <Button
                  variant="contained"
                  startIcon={<MdOutlineUploadFile />}
                  disabled={isLoading}
                >
                  {t('documents.overview.uploadDocument')}
                </Button>
              </Link>
            }
          </ListViewActions>
        </PermissionControl>

        <ListViewFilterArea>
          <InputGroup>
            <Input
              value={filter}
              onChange={value => {
                setFilter(value);
                setActivePage(1);
              }}
            />
            <InputGroup.Addon>
              <MdSearch />
            </InputGroup.Addon>
          </InputGroup>
        </ListViewFilterArea>
      </ListViewContainer>

      {storage && (
        <p
          style={{
            margin: '12px 0',
            color: storageColor,
            fontSize: 14,
            fontWeight: isOverLimit || isNearLimit ? 'bold' : 'normal',
          }}
        >
          {t('documents.overview.storageUsage', {
            used: prettyBytes(storage.usedBytes),
            limit:
              hasLimit ?
                prettyBytes(storage.limitBytes)
              : t('documents.overview.unlimited'),
            count: storage.documentCount,
          })}
          {isOverLimit && ` — ${t('documents.overview.storageFull')}`}
          {isNearLimit && ` — ${t('documents.overview.storageWarning')}`}
          {hasLimit && (
            <>
              {' '}
              <InfoTooltip text={t('documents.overview.storageUsageInfo')} />
            </>
          )}
        </p>
      )}

      <TableWrapper>
        <Table
          fillHeight
          data={documents}
          rowHeight={100}
          loading={isLoading}
          wordWrap
        >
          <Column
            width={120}
            align="center"
            resizable
          >
            <HeaderCell>{t('documents.overview.preview')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullDocumentFragment>) => (
                <Link to={`/documents/edit/${rowData.id}`}>
                  {rowData.thumbnailURL ?
                    <Thumbnail src={rowData.thumbnailURL} />
                  : <MdOutlineUploadFile size={40} />}
                </Link>
              )}
            </RCell>
          </Column>

          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('documents.overview.title')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullDocumentFragment>) => (
                <Link to={`/documents/edit/${rowData.id}`}>
                  {rowData.title || t('documents.overview.untitled')}
                </Link>
              )}
            </RCell>
          </Column>

          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('documents.overview.filename')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullDocumentFragment>) => (
                <p>{rowData.filename || ''}</p>
              )}
            </RCell>
          </Column>

          <Column
            width={280}
            align="left"
            resizable
          >
            <HeaderCell>{t('documents.overview.description')}</HeaderCell>
            <RCell className={'displayThreeLinesOnly'}>
              {(rowData: RowDataType<FullDocumentFragment>) => (
                <p className={'displayThreeLinesOnly'}>
                  {rowData.description || t('documents.overview.noDescription')}
                </p>
              )}
            </RCell>
          </Column>

          <Column
            width={100}
            align="left"
            resizable
          >
            <HeaderCell>{t('documents.overview.fileSize')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullDocumentFragment>) => (
                <p>{prettyBytes(rowData.fileSize as number)}</p>
              )}
            </RCell>
          </Column>

          <Column
            width={220}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullDocumentFragment>) => (
                <>
                  <IconButtonTooltip caption={t('documents.overview.copyLink')}>
                    <IconButton
                      aria-label={t('documents.overview.copyLink')}
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(rowData.url as string);
                        enqueueSnackbar('', {
                          variant: 'success',
                          title: t('documents.panels.linkCopied'),
                          autoHideDuration: 2000,
                        });
                      }}
                    >
                      <MdContentCopy />
                    </IconButton>
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('documents.overview.openLink')}>
                    <a
                      href={rowData.url as string}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <IconButton
                        aria-label={t('documents.overview.openLink')}
                        size="small"
                      >
                        <MdOpenInNew />
                      </IconButton>
                    </a>
                  </IconButtonTooltip>
                  <PermissionControl
                    qualifyingPermissions={['CAN_CREATE_DOCUMENT']}
                  >
                    <IconButtonTooltip caption={t('documents.overview.edit')}>
                      <Link to={`/documents/edit/${rowData.id}`}>
                        <IconButton
                          aria-label={t('documents.overview.edit')}
                          size="small"
                        >
                          <MdEdit />
                        </IconButton>
                      </Link>
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={['CAN_DELETE_DOCUMENT']}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        aria-label={t('delete')}
                        size="small"
                        color="error"
                        onClick={event => {
                          event.preventDefault();
                          setCurrentDocument(rowData as FullDocumentFragment);
                          setConfirmationDialogOpen(true);
                        }}
                      >
                        <MdDelete />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                </>
              )}
            </PaddedCell>
          </Column>
        </Table>

        <Pagination
          state={{
            page: activePage,
            limit,
            setPage: setActivePage,
            setLimit: limit => {
              setLimit(limit);
              setActivePage(1);
            },
          }}
          totalCount={data?.documents.totalCount ?? 0}
        />
      </TableWrapper>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isUploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          navigate('/documents');
        }}
      >
        <DocumentUploadAndEditPanel
          onClose={() => {
            setUploadModalOpen(false);
            navigate('/documents');
          }}
          onUpload={() => {
            setUploadModalOpen(false);
            refetchStorage();
            navigate('/documents');
          }}
        />
      </Drawer>
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          navigate('/documents');
        }}
      >
        <DocumentEditPanel
          id={editID!}
          onClose={() => {
            setEditModalOpen(false);
            navigate('/documents');
          }}
        />
      </Drawer>
      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('documents.panels.deleteDocument')}</DialogTitle>

        <DialogContent>
          <p>
            {`${currentDocument?.filename || t('documents.panels.untitled')}${currentDocument?.extension}` ||
              '-'}
          </p>
          <p>{currentDocument?.title || t('documents.panels.untitled')}</p>
          <p>{currentDocument?.description || '-'}</p>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentDocument) {
                return;
              }

              await deleteDocument({
                variables: { id: currentDocument.id },
                update: cache => {
                  const query = cache.readQuery<DocumentListQuery>({
                    query: DocumentListDocument,
                    variables: listVariables,
                  });

                  if (!query) return;

                  cache.writeQuery<DocumentListQuery>({
                    query: DocumentListDocument,
                    data: {
                      __typename: 'Query',
                      documents: {
                        ...query.documents,
                        nodes: query.documents.nodes.filter(
                          doc => doc.id !== currentDocument.id
                        ),
                      },
                    },
                    variables: listVariables,
                  });
                },
              });
              setConfirmationDialogOpen(false);
              refetchStorage();
            }}
            color="error"
          >
            {t('documents.panels.confirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('documents.panels.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_DOCUMENTS',
  'CAN_GET_DOCUMENT',
  'CAN_DELETE_DOCUMENT',
  'CAN_CREATE_DOCUMENT',
])(DocumentList);
export { CheckedPermissionComponent as DocumentList };
