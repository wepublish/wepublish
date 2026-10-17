import { useMutation, useQuery } from '@apollo/client/react';
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
  DeleteVideoDocument,
  VideoListDocument,
  VideoListQuery,
  VideoStorageUsageDocument,
  FullVideoFragment,
} from '@wepublish/editor/api';
import {
  CanCreateVideo,
  CanDeleteVideo,
  CanGetVideo,
  CanGetVideos,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  VideoEditPanel,
  VideoUploadAndEditPanel,
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
  MdPlayCircleOutline,
  MdSearch,
} from 'react-icons/md';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

function VideoList() {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { id } = params;

  const isUploadRoute = location.pathname.includes('upload');
  const isEditRoute = location.pathname.includes('edit');

  const { filter, setFilter, limit, setLimit } = useListViewState<string>(
    'videos',
    { defaultFilter: '' }
  );

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<FullVideoFragment>();

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
  } = useQuery(VideoListDocument, {
    variables: listVariables,
  });

  const videos = data?.videos.nodes ?? [];

  const [deleteVideo, { loading: isDeleting }] = useMutation(
    DeleteVideoDocument,
    {}
  );

  const {
    data: storageData,
    error: storageError,
    refetch: refetchStorage,
  } = useQuery(VideoStorageUsageDocument);
  if (storageError) {
    console.error('VideoStorageUsage query error:', storageError);
  }

  const storage = storageData?.videoStorageUsage;
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
          <PageTitle>{t('videos.overview.videoLibrary')}</PageTitle>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreateVideo.id]}>
          <ListViewActions>
            {isOverLimit ?
              <Button
                variant="contained"
                startIcon={<MdOutlineUploadFile />}
                disabled
              >
                {t('videos.overview.storageFull')}
              </Button>
            : <Button
                component={RouterLink}
                to="/videos/upload"
                state={{ modalLocation: location }}
                variant="contained"
                startIcon={<MdOutlineUploadFile />}
                disabled={isLoading}
              >
                {t('videos.overview.uploadVideo')}
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
          {t('videos.overview.storageUsage', {
            used: prettyBytes(storage.usedBytes),
            limit:
              hasLimit ?
                prettyBytes(storage.limitBytes)
              : t('videos.overview.unlimited'),
            count: storage.videoCount,
          })}
          {isOverLimit && ` — ${t('videos.overview.storageFull')}`}
          {isNearLimit && ` — ${t('videos.overview.storageWarning')}`}
          {hasLimit && (
            <>
              {' '}
              <InfoTooltip text={t('videos.overview.storageUsageInfo')} />
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
          storageKey="videos"
          data={videos}
          loading={isLoading}
          columns={[
            {
              id: 'preview',
              label: t('videos.overview.preview'),
              width: 120,
              align: 'center',
              render: rowData => (
                <Link to={`/videos/edit/${rowData.id}`}>
                  <MdPlayCircleOutline size={40} />
                </Link>
              ),
            },
            {
              id: 'title',
              alwaysVisible: true,
              label: t('videos.overview.title'),
              width: 200,
              align: 'left',
              render: rowData => (
                <Link to={`/videos/edit/${rowData.id}`}>
                  {rowData.title || t('videos.overview.untitled')}
                </Link>
              ),
            },
            {
              id: 'filename',
              label: t('videos.overview.filename'),
              width: 200,
              align: 'left',
              render: rowData => (
                <Typography>{rowData.filename || ''}</Typography>
              ),
            },
            {
              id: 'description',
              label: t('videos.overview.description'),
              width: 280,
              align: 'left',
              render: rowData => (
                <Typography className={'displayThreeLinesOnly'}>
                  {rowData.description || t('videos.overview.noDescription')}
                </Typography>
              ),
            },
            {
              id: 'filesize',
              label: t('videos.overview.fileSize'),
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
                  <IconButtonTooltip caption={t('videos.overview.copyLink')}>
                    <IconButton
                      aria-label={t('videos.overview.copyLink')}
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(rowData.url as string);
                        enqueueSnackbar('', {
                          variant: 'success',
                          title: t('videos.panels.linkCopied'),
                          autoHideDuration: 2000,
                        });
                      }}
                    >
                      <MdContentCopy />
                    </IconButton>
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('videos.overview.openLink')}>
                    <a
                      href={rowData.url as string}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <IconButton
                        aria-label={t('videos.overview.openLink')}
                        size="small"
                      >
                        <MdOpenInNew />
                      </IconButton>
                    </a>
                  </IconButtonTooltip>
                  <PermissionControl
                    qualifyingPermissions={[CanCreateVideo.id]}
                  >
                    <IconButtonTooltip caption={t('videos.overview.edit')}>
                      <IconButton
                        component={RouterLink}
                        to={`/videos/edit/${rowData.id}`}
                        aria-label={t('videos.overview.edit')}
                        size="small"
                      >
                        <MdEdit />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={[CanDeleteVideo.id]}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        aria-label={t('delete')}
                        size="small"
                        color="error"
                        onClick={event => {
                          event.preventDefault();
                          setCurrentVideo(rowData as FullVideoFragment);
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
          totalCount={data?.videos.totalCount ?? 0}
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
          navigate('/videos');
        }}
      >
        <VideoUploadAndEditPanel
          onClose={() => {
            setUploadModalOpen(false);
            navigate('/videos');
          }}
          onUpload={() => {
            setUploadModalOpen(false);
            refetchStorage();
            navigate('/videos');
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
          navigate('/videos');
        }}
      >
        <VideoEditPanel
          id={editID!}
          onClose={() => {
            setEditModalOpen(false);
            navigate('/videos');
          }}
        />
      </Drawer>

      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('videos.panels.deleteVideo')}</DialogTitle>

        <DialogContent>
          <Typography>
            {`${currentVideo?.filename || t('videos.panels.untitled')}${currentVideo?.extension}` ||
              '-'}
          </Typography>
          <Typography>
            {currentVideo?.title || t('videos.panels.untitled')}
          </Typography>
          <Typography>{currentVideo?.description || '-'}</Typography>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('videos.panels.cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentVideo) {
                return;
              }

              await deleteVideo({
                variables: { id: currentVideo.id },
                update: cache => {
                  const query = cache.readQuery<VideoListQuery>({
                    query: VideoListDocument,
                    variables: listVariables,
                  });

                  if (!query) {
                    return;
                  }

                  cache.writeQuery<VideoListQuery>({
                    query: VideoListDocument,
                    data: {
                      __typename: 'Query',
                      videos: {
                        ...query.videos,
                        nodes: query.videos.nodes.filter(
                          doc => doc.id !== currentVideo.id
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
            {t('videos.panels.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetVideos.id,
  CanGetVideo.id,
  CanDeleteVideo.id,
  CanCreateVideo.id,
])(VideoList);
export { CheckedPermissionComponent as VideoList };
