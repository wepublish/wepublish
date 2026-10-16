import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Avatar as MuiAvatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormHelperText,
  Grid,
  IconButton,
  List,
  ListItem as MuiListItem,
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
  DescriptionList,
  DescriptionListItem,
  DRAWER_WIDTHS,
  enqueueSnackbar,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  NavigationBar,
  PageTitle,
  PeerEditPanel,
  PeerInfoEditPanel,
  PermissionControl,
  useSeededState,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdDelete,
  MdSettings,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

const MarginTop = styled.div`
  margin-top: 20px;
`;

const Avatar = styled(MuiAvatar)`
  border: solid 2px ${({ theme }) => theme.vars.palette.primary.main};
`;

const AvatarWrapper = styled.div`
  text-align: center;
`;

const Wrapper = styled.div`
  border: solid 2px ${({ theme }) => theme.vars.palette.primary.main};
  padding: 12px;
  border-radius: ${({ theme }) => theme.shape.borderRadius + 'px'};
  margin: 1rem 0 2rem 0;
`;

const ListItem = styled(MuiListItem)<{ isDisabled?: boolean | null }>`
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
`;

const FlexItem = styled(Grid)`
  text-align: center;
`;

type Peer = NonNullable<PeerListQuery['peers']>[number];

function PeerList() {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { id } = params;

  const isCreateRoute = location.pathname.includes('create');
  const isPeerEditRoute = location.pathname.includes('peering/edit');
  const isPeerProfileEditRoute = location.pathname.includes(
    'peering/profile/edit'
  );
  const isAuthorRoute = location.pathname.includes('author');

  const [isPeerProfileEditModalOpen, setPeerProfileEditModalOpen] = useState(
    isPeerProfileEditRoute
  );
  const [isEditModalOpen, setEditModalOpen] = useState(isPeerProfileEditRoute);
  const [editID, setEditID] = useState<string | undefined>(
    isAuthorRoute ? id : undefined
  );
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

  useSeededState(
    isPeerProfileEditRoute || isCreateRoute || isPeerEditRoute ?
      location.pathname
    : undefined,
    () => {
      if (isPeerProfileEditRoute) {
        setPeerProfileEditModalOpen(true);
        return;
      }

      setEditID(isPeerEditRoute ? id : undefined);
      setEditModalOpen(true);
    }
  );

  const peers = peerListData?.peers?.map(peer => {
    const { id, name, profile, hostURL, isDisabled } = peer;
    return (
      <RouterLink
        to={isDisabled ? '#' : `/peering/edit/${id}`}
        key={name}
      >
        <ListItem isDisabled={isDisabled}>
          <Grid
            container
            spacing={2}
          >
            <FlexItem size={{ xs: 1 }}>
              <Avatar
                src={
                  profile?.squareLogo?.xxsSquare ??
                  profile?.logo?.xxsSquare ??
                  undefined
                }
                alt={profile?.name?.substr(0, 2)}
              />
            </FlexItem>
            <Grid
              size={{ xs: 9 }}
              container
              spacing={2}
            >
              <Typography variant="h5">{name}</Typography>
              <Typography>
                {profile && `${profile.name} - `}
                {hostURL}
              </Typography>
            </Grid>

            <Grid
              size={{ xs: 2 }}
              container
              spacing={2}
            >
              <PermissionControl qualifyingPermissions={[CanCreatePeer.id]}>
                <Button
                  variant="contained"
                  startIcon={
                    isDisabled ? <MdVisibility /> : <MdVisibilityOff />
                  }
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    updatePeer({
                      variables: { id, isDisabled: !isDisabled },
                    })
                  }
                >
                  {isDisabled ?
                    t('peerList.overview.enable')
                  : t('peerList.overview.disable')}
                </Button>
              </PermissionControl>
            </Grid>

            <FlexItem size={{ xs: 1 }}>
              <PermissionControl qualifyingPermissions={[CanDeletePeer.id]}>
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    disabled={isPeerInfoLoading}
                    size="small"
                    color="error"
                    aria-label={t('delete')}
                    onClick={e => {
                      e.preventDefault();
                      setConfirmationDialogOpen(true);
                      setCurrentPeer(peer);
                    }}
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              </PermissionControl>
            </FlexItem>
          </Grid>
        </ListItem>
      </RouterLink>
    );
  });

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
        <Wrapper>
          <NavigationBar
            centerChildren={
              <AvatarWrapper>
                <Avatar
                  sx={{ width: 56, height: 56 }}
                  src={
                    peerInfoData?.peerProfile?.squareLogo?.squareURL ??
                    peerInfoData?.peerProfile?.logo?.squareURL ??
                    undefined
                  }
                  alt={peerInfoData?.peerProfile?.name?.substr(0, 2)}
                />
                <Typography variant="h5">
                  {peerInfoData?.peerProfile.name ||
                    t('peerList.panels.unnamed')}
                </Typography>
                <Typography>{peerInfoData?.peerProfile.hostURL}</Typography>
                <FormHelperText>
                  {t('peerList.panels.checkOwnPeerProfileHelpBlock')}{' '}
                  <a
                    href="https://wepublish.ch/peering-infos-preview/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('peerList.panels.peeringPreviewGuide')}
                  </a>
                </FormHelperText>
              </AvatarWrapper>
            }
            rightChildren={
              <PermissionControl
                qualifyingPermissions={[CanUpdatePeerProfile.id]}
              >
                <IconButtonTooltip caption={t('peerList.overview.editProfile')}>
                  <IconButton
                    component={RouterLink}
                    to="/peering/profile/edit"
                    sx={{ width: 56, height: 56 }}
                    aria-label={t('peerList.overview.editProfile')}
                  >
                    <MdSettings />
                  </IconButton>
                </IconButtonTooltip>
              </PermissionControl>
            }
          />
        </Wrapper>
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
      <MarginTop>
        {peerListData?.peers?.length ?
          <List>{peers}</List>
        : !isPeerListLoading ?
          <Typography>{t('peerList.overview.noPeersFound')}</Typography>
        : null}
      </MarginTop>

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
          setPeerProfileEditModalOpen(false);
          navigate('/peering');
        }}
      >
        <PeerInfoEditPanel
          onClose={() => {
            setPeerProfileEditModalOpen(false);
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
          setEditModalOpen(false);
          navigate('/peering');
        }}
      >
        {peerInfoData?.peerProfile.hostURL && (
          <PeerEditPanel
            id={editID}
            hostURL={peerInfoData.peerProfile.hostURL}
            onClose={() => {
              setEditModalOpen(false);
              navigate('/peering');
            }}
            onSave={() => {
              setEditModalOpen(false);
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
