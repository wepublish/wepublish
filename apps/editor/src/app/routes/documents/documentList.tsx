import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  DeleteDocumentDocument,
  DocumentListDocument,
  DocumentListQuery,
  DocumentStorageUsageDocument,
  FullDocumentFragment,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  DocumentEditPanel,
  DocumentUploadAndEditPanel,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  PaddedCell,
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
import {
  Button,
  Drawer,
  IconButton as RIconButton,
  Input,
  InputGroup,
  Modal,
  Notification,
  Pagination,
  Table as RTable,
  toaster,
} from 'rsuite';
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
              <RIconButton
                appearance="primary"
                disabled
                icon={<MdOutlineUploadFile />}
              >
                {t('documents.overview.storageFull')}
              </RIconButton>
            : <Link
                to="/documents/upload"
                state={{ modalLocation: location }}
              >
                <RIconButton
                  appearance="primary"
                  disabled={isLoading}
                  icon={<MdOutlineUploadFile />}
                >
                  {t('documents.overview.uploadDocument')}
                </RIconButton>
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
                      icon={<MdContentCopy />}
                      circle
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(rowData.url as string);
                        toaster.push(
                          <Notification
                            type="success"
                            header={t('documents.panels.linkCopied')}
                            duration={2000}
                          />,
                          { placement: 'topEnd' }
                        );
                      }}
                    />
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('documents.overview.openLink')}>
                    <a
                      href={rowData.url as string}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <IconButton
                        aria-label={t('documents.overview.openLink')}
                        icon={<MdOpenInNew />}
                        circle
                        size="sm"
                      />
                    </a>
                  </IconButtonTooltip>
                  <PermissionControl
                    qualifyingPermissions={['CAN_CREATE_DOCUMENT']}
                  >
                    <IconButtonTooltip caption={t('documents.overview.edit')}>
                      <Link to={`/documents/edit/${rowData.id}`}>
                        <IconButton
                          aria-label={t('documents.overview.edit')}
                          icon={<MdEdit />}
                          circle
                          size="sm"
                        />
                      </Link>
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={['CAN_DELETE_DOCUMENT']}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        aria-label={t('delete')}
                        icon={<MdDelete />}
                        circle
                        size="sm"
                        appearance="ghost"
                        color="red"
                        onClick={event => {
                          event.preventDefault();
                          setCurrentDocument(rowData as FullDocumentFragment);
                          setConfirmationDialogOpen(true);
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                </>
              )}
            </PaddedCell>
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
          total={data?.documents.totalCount ?? 0}
          activePage={activePage}
          onChangePage={page => setActivePage(page)}
          onChangeLimit={limit => {
            setLimit(limit);
            setActivePage(1);
          }}
        />
      </TableWrapper>

      <Drawer
        open={isUploadModalOpen}
        size="sm"
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
        open={isEditModalOpen}
        size="sm"
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
      <Modal
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <Modal.Title>{t('documents.panels.deleteDocument')}</Modal.Title>

        <Modal.Body>
          <p>
            {`${currentDocument?.filename || t('documents.panels.untitled')}${currentDocument?.extension}` ||
              '-'}
          </p>
          <p>{currentDocument?.title || t('documents.panels.untitled')}</p>
          <p>{currentDocument?.description || '-'}</p>
        </Modal.Body>

        <Modal.Footer>
          <Button
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
            color="red"
          >
            {t('documents.panels.confirm')}
          </Button>
          <Button
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('documents.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
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
