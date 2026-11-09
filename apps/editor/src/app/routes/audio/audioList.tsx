import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import {
  DeleteAudioDocument,
  AudioListDocument,
  AudioListQuery,
  AudioStorageUsageDocument,
  FullAudioFragment,
} from '@wepublish/editor/api';
import {
  CanCreateAudio,
  CanDeleteAudio,
  CanGetAudio,
  CanGetAudios,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  getOperationNameFromDocument,
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
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';

function AudioList() {
  const navigate = useNavigate();

  const { filter, setFilter, limit, setLimit } = useListViewState<string>(
    'audios',
    { defaultFilter: '' }
  );

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<FullAudioFragment>();

  const [activePage, setActivePage] = useState(1);

  const listVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (activePage - 1) * limit,
  };

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(AudioListDocument, {
    variables: listVariables,
  });

  const audios = data?.audios.nodes ?? [];

  const [deleteAudio, { loading: isDeleting }] = useMutation(
    DeleteAudioDocument,
    {
      refetchQueries: [getOperationNameFromDocument(AudioStorageUsageDocument)],
    }
  );

  const {
    data: storageData,
    error: storageError,
    refetch: refetchStorage,
  } = useQuery(AudioStorageUsageDocument);
  if (storageError) {
    console.error('AudioStorageUsage query error:', storageError);
  }

  const storage = storageData?.audioStorageUsage;
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

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('audio.overview.audioLibrary')}</PageTitle>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreateAudio.id]}>
          <ListViewActions>
            {isOverLimit ?
              <Button
                variant="contained"
                startIcon={<MdOutlineUploadFile />}
                disabled
              >
                {t('audio.overview.storageFull')}
              </Button>
            : <Button
                component={RouterLink}
                to="/audio/upload"
                variant="contained"
                startIcon={<MdOutlineUploadFile />}
              >
                {t('audio.overview.uploadAudio')}
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
          {t('audio.overview.storageUsage', {
            used: prettyBytes(storage.usedBytes),
            limit:
              hasLimit ?
                prettyBytes(storage.limitBytes)
              : t('audio.overview.unlimited'),
            count: storage.audioCount,
          })}
          {isOverLimit && ` — ${t('audio.overview.storageFull')}`}
          {isNearLimit && ` — ${t('audio.overview.storageWarning')}`}
          {hasLimit && (
            <>
              {' '}
              <InfoTooltip text={t('audio.overview.storageUsageInfo')} />
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
          storageKey="audios"
          data={audios}
          loading={isLoading}
          columns={[
            {
              id: 'title',
              alwaysVisible: true,
              label: t('audio.overview.title'),
              width: 200,
              align: 'left',
              render: rowData => (
                <Link to={`/audio/edit/${rowData.id}`}>
                  {rowData.title || t('audio.overview.untitled')}
                </Link>
              ),
            },
            {
              id: 'filename',
              label: t('audio.overview.filename'),
              width: 200,
              align: 'left',
              render: rowData => (
                <Typography>
                  {rowData.filename ?
                    `${rowData.filename}${rowData.extension ?? ''}`
                  : ''}
                </Typography>
              ),
            },
            {
              id: 'description',
              label: t('audio.overview.description'),
              width: 280,
              align: 'left',
              render: rowData => (
                <Typography className={'displayThreeLinesOnly'}>
                  {rowData.description || t('audio.overview.noDescription')}
                </Typography>
              ),
            },
            {
              id: 'filesize',
              label: t('audio.overview.fileSize'),
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
                  <IconButtonTooltip caption={t('audio.overview.copyLink')}>
                    <IconButton
                      aria-label={t('audio.overview.copyLink')}
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(rowData.url as string);
                        enqueueSnackbar('', {
                          variant: 'success',
                          title: t('audio.panels.linkCopied'),
                          autoHideDuration: 2000,
                        });
                      }}
                    >
                      <MdContentCopy />
                    </IconButton>
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('audio.overview.openLink')}>
                    <a
                      href={rowData.url as string}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <IconButton
                        aria-label={t('audio.overview.openLink')}
                        size="small"
                      >
                        <MdOpenInNew />
                      </IconButton>
                    </a>
                  </IconButtonTooltip>
                  <PermissionControl
                    qualifyingPermissions={[CanCreateAudio.id]}
                  >
                    <IconButtonTooltip caption={t('audio.overview.edit')}>
                      <IconButton
                        component={RouterLink}
                        to={`/audio/edit/${rowData.id}`}
                        aria-label={t('audio.overview.edit')}
                        size="small"
                      >
                        <MdEdit />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={[CanDeleteAudio.id]}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        aria-label={t('delete')}
                        size="small"
                        color="error"
                        onClick={event => {
                          event.preventDefault();
                          setCurrentAudio(rowData as FullAudioFragment);
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
          totalCount={data?.audios.totalCount ?? 0}
        />
      </TableWrapper>

      <Outlet />

      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('audio.panels.deleteAudio')}</DialogTitle>

        <DialogContent>
          <Typography>
            {`${currentAudio?.filename || t('audio.panels.untitled')}${currentAudio?.extension}` ||
              '-'}
          </Typography>
          <Typography>
            {currentAudio?.title || t('audio.panels.untitled')}
          </Typography>
          <Typography>{currentAudio?.description || '-'}</Typography>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('audio.panels.cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentAudio) {
                return;
              }

              await deleteAudio({
                variables: { id: currentAudio.id },
                update: cache => {
                  const query = cache.readQuery<AudioListQuery>({
                    query: AudioListDocument,
                    variables: listVariables,
                  });

                  if (!query) {
                    return;
                  }

                  cache.writeQuery<AudioListQuery>({
                    query: AudioListDocument,
                    data: {
                      __typename: 'Query',
                      audios: {
                        ...query.audios,
                        nodes: query.audios.nodes.filter(
                          doc => doc.id !== currentAudio.id
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
            {t('audio.panels.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetAudios.id,
  CanGetAudio.id,
  CanDeleteAudio.id,
  CanCreateAudio.id,
])(AudioList);
export { CheckedPermissionComponent as AudioList };
