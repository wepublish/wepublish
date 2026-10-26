import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Link,
  Typography,
} from '@mui/material';
import {
  DeletePeerDocument,
  PeerListDocument,
  PeerListQuery,
  PeerProfileDocument,
  UpdatePeerDocument,
} from '@wepublish/editor/api';
import {
  CanCreatePeer,
  CanDeletePeer,
  CanGetPeer,
  CanGetPeerProfile,
  CanGetPeers,
  CanUpdatePeerProfile,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  DescriptionList,
  DescriptionListItem,
  DRAWER_WIDTHS,
  enqueueSnackbar,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  PeerEditPanel,
  PeerInfoEditPanel,
  PermissionControl,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdOutlineEdit,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

const ProfileCard = styled(Card)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2, 3)};
  padding: ${({ theme }) => theme.spacing(3)};
  margin-bottom: ${({ theme }) => theme.spacing(5)};
`;

const ProfileText = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  flex: 1 1 240px;
  min-width: 0;
`;

const NameCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  min-width: 0;
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

type Peer = NonNullable<PeerListQuery['peers']>[number];

const initials = (name?: string | null) => name?.slice(0, 2).toUpperCase();

function PeerList() {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { id } = params;

  const isCreateRoute = location.pathname.includes('create');
  const isPeerEditRoute = location.pathname.includes('peering/edit');
  const isPeerProfileEditModalOpen = location.pathname.includes(
    'peering/profile/edit'
  );
  const isEditModalOpen = isCreateRoute || isPeerEditRoute;
  const editID = isPeerEditRoute ? id : undefined;

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentPeer, setCurrentPeer] = useState<Peer>();

  const { data: peerInfoData, loading: isPeerInfoLoading } = useQuery(
    PeerProfileDocument,
    {}
  );

  const { data: peerListData, loading: isPeerListLoading } = useQuery(
    PeerListDocument,
    {
      errorPolicy: 'ignore',
    }
  );

  const [deletePeer, { loading: isDeleting }] = useMutation(
    DeletePeerDocument,
    {}
  );
  const [updatePeer, { loading: isUpdating }] = useMutation(
    UpdatePeerDocument,
    {}
  );

  const { t } = useTranslation();

  return (
    <>
      <PermissionControl qualifyingPermissions={[CanGetPeerProfile.id]}>
        <ListViewContainer>
          <ListViewHeader>
            <PageTitle>
              {t('peerList.overview.myPeerProfile')}{' '}
              <InfoTooltip text={t('peerList.overview.myPeerProfileInfo')} />
            </PageTitle>
          </ListViewHeader>
        </ListViewContainer>

        <ProfileCard variant="outlined">
          <Avatar
            variant="rounded"
            sx={{ width: 64, height: 64, bgcolor: 'action.hover' }}
            slotProps={{ img: { style: { objectFit: 'contain' } } }}
            src={
              peerInfoData?.peerProfile?.squareLogo?.mediumURL ??
              peerInfoData?.peerProfile?.logo?.mediumURL ??
              undefined
            }
            alt=""
          >
            {initials(peerInfoData?.peerProfile?.name)}
          </Avatar>

          <ProfileText>
            <Typography
              variant="h6"
              component="p"
            >
              {peerInfoData?.peerProfile.name || t('peerList.panels.unnamed')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
            >
              {peerInfoData?.peerProfile.hostURL}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {t('peerList.panels.checkOwnPeerProfileHelpBlock')}{' '}
              <Link
                href="https://wepublish.ch/peering-infos-preview/"
                target="_blank"
                rel="noreferrer"
              >
                {t('peerList.panels.peeringPreviewGuide')}
              </Link>
            </Typography>
          </ProfileText>

          <PermissionControl qualifyingPermissions={[CanUpdatePeerProfile.id]}>
            <Button
              component={RouterLink}
              to="/peering/profile/edit"
              variant="outlined"
              startIcon={<MdEdit />}
            >
              {t('peerList.overview.editProfile')}
            </Button>
          </PermissionControl>
        </ProfileCard>
      </PermissionControl>

      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>
            {t('peerList.overview.peers')}{' '}
            <InfoTooltip text={t('peerList.overview.peersInfo')} />
          </PageTitle>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreatePeer.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/peering/create"
              variant="contained"
              startIcon={<MdAdd />}
              disabled={isPeerListLoading}
            >
              {t('peerList.overview.newPeer')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="peers"
          data={peerListData?.peers ?? []}
          loading={isPeerListLoading}
          emptyMessage={t('peerList.overview.noPeersFound')}
          getRowId={row => row.id}
          columns={[
            {
              id: 'status',
              alwaysVisible: true,
              label: t('peerList.overview.status'),
              width: 130,
              align: 'left',
              render: row =>
                row.isDisabled ?
                  <Chip
                    size="small"
                    label={t('peerList.overview.disabled')}
                  />
                : <Chip
                    size="small"
                    color="success"
                    label={t('peerList.overview.active')}
                  />,
            },
            {
              id: 'name',
              alwaysVisible: true,
              label: t('peerList.overview.name'),
              width: 260,
              align: 'left',
              render: row => (
                <NameCell>
                  <Avatar
                    sx={{ width: 32, height: 32 }}
                    src={
                      row.profile?.squareLogo?.xxsSquare ??
                      row.profile?.logo?.xxsSquare ??
                      undefined
                    }
                    alt=""
                  >
                    {initials(row.name)}
                  </Avatar>
                  {row.name}
                </NameCell>
              ),
            },
            {
              id: 'hostURL',
              label: t('peerList.overview.hostURL'),
              width: 300,
              align: 'left',
              render: row => (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                >
                  {row.hostURL}
                </Typography>
              ),
            },
            {
              id: 'website',
              label: t('peerList.overview.website'),
              width: 260,
              align: 'left',
              render: row =>
                row.profile?.websiteURL && (
                  <Link
                    href={row.profile.websiteURL}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                    variant="body2"
                    noWrap
                  >
                    {row.profile.websiteURL.replace(/^https?:\/\//, '')}
                  </Link>
                ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 140,
              align: 'center',
              fixed: true,
              render: row => (
                <Actions>
                  <IconButtonTooltip caption={t('peerList.panels.editPeer')}>
                    {row.isDisabled ?
                      <IconButton
                        size="small"
                        disabled
                        aria-label={t('peerList.panels.editPeer')}
                      >
                        <MdOutlineEdit />
                      </IconButton>
                    : <IconButton
                        component={RouterLink}
                        to={`/peering/edit/${row.id}`}
                        size="small"
                        aria-label={t('peerList.panels.editPeer')}
                      >
                        <MdOutlineEdit />
                      </IconButton>
                    }
                  </IconButtonTooltip>

                  <PermissionControl qualifyingPermissions={[CanCreatePeer.id]}>
                    <IconButtonTooltip
                      caption={
                        row.isDisabled ?
                          t('peerList.overview.enable')
                        : t('peerList.overview.disable')
                      }
                    >
                      <IconButton
                        size="small"
                        disabled={isUpdating}
                        aria-label={
                          row.isDisabled ?
                            t('peerList.overview.enable')
                          : t('peerList.overview.disable')
                        }
                        onClick={() =>
                          updatePeer({
                            variables: {
                              id: row.id,
                              isDisabled: !row.isDisabled,
                            },
                          })
                        }
                      >
                        {row.isDisabled ?
                          <MdVisibility />
                        : <MdVisibilityOff />}
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl qualifyingPermissions={[CanDeletePeer.id]}>
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isPeerInfoLoading}
                        aria-label={t('delete')}
                        onClick={() => {
                          setConfirmationDialogOpen(true);
                          setCurrentPeer(row);
                        }}
                      >
                        <MdDelete />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                </Actions>
              ),
            },
          ]}
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
        open={isPeerProfileEditModalOpen}
        onClose={() => {
          navigate('/peering');
        }}
      >
        <PeerInfoEditPanel
          onClose={() => {
            navigate('/peering');
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
          navigate('/peering');
        }}
      >
        {peerInfoData?.peerProfile.hostURL && (
          <PeerEditPanel
            id={editID}
            hostURL={peerInfoData.peerProfile.hostURL}
            onClose={() => {
              navigate('/peering');
            }}
            onSave={() => {
              enqueueSnackbar(
                editID ?
                  t('peerList.panels.peerUpdated')
                : t('peerList.panels.peerCreated'),
                { variant: 'success', autoHideDuration: 2000 }
              );
              navigate('/peering');
            }}
          />
        )}
      </Drawer>

      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('peerList.panels.deletePeer')}</DialogTitle>
        <DialogContent>
          <DescriptionList>
            <DescriptionListItem label={t('peerList.panels.name')}>
              {currentPeer?.name || t('peerList.panels.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('peerList.panels.cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isDeleting}
            color="error"
            onClick={async () => {
              if (!currentPeer) {
                return;
              }

              await deletePeer({
                variables: { id: currentPeer.id },
                update: cache => {
                  const query = cache.readQuery<PeerListQuery>({
                    query: PeerListDocument,
                  });

                  if (!query) {
                    return;
                  }

                  cache.writeQuery<PeerListQuery>({
                    query: PeerListDocument,
                    data: {
                      __typename: 'Query',
                      peers: query.peers?.filter(
                        peer => peer.id !== currentPeer.id
                      ),
                    },
                  });
                },
              });
              setConfirmationDialogOpen(false);
            }}
          >
            {t('peerList.panels.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPeers.id,
  CanGetPeer.id,
  CanDeletePeer.id,
  CanCreatePeer.id,
  CanGetPeerProfile.id,
  CanUpdatePeerProfile.id,
])(PeerList);
export { CheckedPermissionComponent as PeerList };
