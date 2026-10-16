import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import {
  DeleteDocumentDocument,
  DocumentListDocument,
  DocumentListQuery,
  DocumentStorageUsageDocument,
  FullDocumentFragment,
} from '@wepublish/editor/api';
import {
  CanCreateDocument,
  CanDeleteDocument,
  CanGetDocument,
  CanGetDocuments,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  DocumentEditPanel,
  DocumentUploadAndEditPanel,
  DRAWER_WIDTHS,
  enqueueSnackbar,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  Pagination,
  PermissionControl,
  TableWrapper,
  useListViewState,
  useSeededState,
  PageTitle,
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
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

const Thumbnail = styled.img`
  height: 70px;
  width: auto;
  display: block;
  margin: 0 auto;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
`;

function DocumentList() {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { id } = params;

  const isUploadRoute = location.pathname.includes('upload');
  const isEditRoute = location.pathname.includes('edit');

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

  const documents = data?.documents.nodes ?? [];

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
    isOverLimit ? 'error.main'
    : isNearLimit ? 'warning.main'
    : 'text.secondary';

  const { t } = useTranslation();

  useEffect(() => {
    refetch(listVariables);
  }, [filter, activePage, limit]);

  useSeededState(
    isUploadRoute || isEditRoute ? location.pathname : undefined,
    () => {
      if (isUploadRoute) {
        setUploadModalOpen(true);
      }

      if (isEditRoute) {
        setEditModalOpen(true);
        setEditID(id);
      }
    }
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('documents.overview.documentLibrary')}</PageTitle>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreateDocument.id]}>
          <ListViewActions>
            {isOverLimit ?
              <Button
                variant="contained"
                startIcon={<MdOutlineUploadFile />}
                disabled
              >
                {t('documents.overview.storageFull')}
              </Button>
            : <Button
                component={RouterLink}
                to="/documents/upload"
                state={{ modalLocation: location }}
                variant="contained"
                startIcon={<MdOutlineUploadFile />}
                disabled={isLoading}
              >
                {t('documents.overview.uploadDocument')}
              </Button>
            }
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      {storage && (
        <Typography
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
        </Typography>
      )}

      <TableWrapper>
        <DataTable
          filters={
            <TextField
              label={t('search')}
              value={filter}
              onChange={event => {
                setFilter(event.target.value);
                setActivePage(1);
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <MdSearch />
                    </InputAdornment>
                  ),
                },
              }}
            />
          }
          filterCount={filter ? 1 : 0}
          onResetFilters={() => {
            setFilter('');
            setActivePage(1);
          }}
          storageKey="documents"
          data={documents}
          loading={isLoading}
          columns={[
            {
              id: 'preview',
              label: t('documents.overview.preview'),
              width: 120,
              align: 'center',
              render: rowData => (
                <Link to={`/documents/edit/${rowData.id}`}>
                  {rowData.thumbnailURL ?
                    <Thumbnail src={rowData.thumbnailURL} />
                  : <MdOutlineUploadFile size={40} />}
                </Link>
              ),
            },
            {
              id: 'title',
              alwaysVisible: true,
              label: t('documents.overview.title'),
              width: 200,
              align: 'left',
              render: rowData => (
                <Link to={`/documents/edit/${rowData.id}`}>
                  {rowData.title || t('documents.overview.untitled')}
                </Link>
              ),
            },
            {
              id: 'filename',
              label: t('documents.overview.filename'),
              width: 200,
              align: 'left',
              render: rowData => (
                <Typography>{rowData.filename || ''}</Typography>
              ),
            },
            {
              id: 'description',
              label: t('documents.overview.description'),
              width: 280,
              align: 'left',
              render: rowData => (
                <Typography className={'displayThreeLinesOnly'}>
                  {rowData.description || t('documents.overview.noDescription')}
                </Typography>
              ),
            },
            {
              id: 'filesize',
              label: t('documents.overview.fileSize'),
              width: 100,
              align: 'left',
              render: rowData => (
                <Typography>
                  {prettyBytes(rowData.fileSize as number)}
                </Typography>
              ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 220,
              align: 'center',
              fixed: true,
              render: rowData => (
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
                    qualifyingPermissions={[CanCreateDocument.id]}
                  >
                    <IconButtonTooltip caption={t('documents.overview.edit')}>
                      <IconButton
                        component={RouterLink}
                        to={`/documents/edit/${rowData.id}`}
                        aria-label={t('documents.overview.edit')}
                        size="small"
                      >
                        <MdEdit />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={[CanDeleteDocument.id]}
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
              ),
            },
          ]}
        />

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
          <Typography>
            {`${currentDocument?.filename || t('documents.panels.untitled')}${currentDocument?.extension}` ||
              '-'}
          </Typography>
          <Typography>
            {currentDocument?.title || t('documents.panels.untitled')}
          </Typography>
          <Typography>{currentDocument?.description || '-'}</Typography>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('documents.panels.cancel')}
          </Button>

          <Button
            variant="contained"
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

                  if (!query) {
                    return;
                  }

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
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetDocuments.id,
  CanGetDocument.id,
  CanDeleteDocument.id,
  CanCreateDocument.id,
])(DocumentList);
export { CheckedPermissionComponent as DocumentList };
