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
  Grid,
  Grid as MuiGrid,
  IconButton,
} from '@mui/material';
import {
  DeletePeerDocument,
  PeerListDocument,
  PeerListQuery,
  PeerProfileDocument,
  UpdatePeerDocument,
} from '@wepublish/editor/api';
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
  PeerEditPanel,
  PeerInfoEditPanel,
  PermissionControl,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdDelete,
  MdSettings,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Form, List } from 'rsuite';

const MarginTop = styled.div`
  margin-top: 20px;
`;

const Avatar = styled(MuiAvatar)`
  border: solid 2px var(--rs-primary-500);
`;

const AvatarWrapper = styled.div`
  text-align: center;
`;

const Wrapper = styled.div`
  border: solid 2px var(--rs-primary-500);
  padding: 12px;
  border-radius: var(--rs-radius-lg);
  margin: 1rem 0 2rem 0;
`;

const ListItem = styled(List.Item)<{ isDisabled?: boolean | null }>`
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
`;

const FlexItem = styled(MuiGrid)`
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

  const {
    data: peerInfoData,
    loading: isPeerInfoLoading,
    error: peerInfoError,
  } = useQuery(PeerProfileDocument, {});

  const {
    data: peerListData,
    loading: isPeerListLoading,
    error: peerListError,
  } = useQuery(PeerListDocument, {
    errorPolicy: 'ignore',
  });

  const [deletePeer, { loading: isDeleting }] = useMutation(
    DeletePeerDocument,
    {}
  );
  const [updatePeer, { loading: isUpdating }] = useMutation(
    UpdatePeerDocument,
    {}
  );

  const { t } = useTranslation();

  useEffect(() => {
    const error = peerInfoError?.message ?? peerListError?.message;
    if (error)
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
  }, [peerInfoError, peerListError]);

  useEffect(() => {
    if (isPeerProfileEditRoute) {
      setPeerProfileEditModalOpen(true);
    }

    if (isCreateRoute) {
      setEditID(undefined);
      setEditModalOpen(true);
    }

    if (isPeerEditRoute) {
      setEditID(id);
      setEditModalOpen(true);
    }
  }, [id, isCreateRoute, isPeerEditRoute, isPeerProfileEditRoute, location]);

  const peers = peerListData?.peers?.map(peer => {
    const { id, name, profile, hostURL, isDisabled } = peer;
    return (
      <Link
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
              <h5>{name}</h5>
              <p>
                {profile && `${profile.name} - `}
                {hostURL}
              </p>
            </Grid>

            <Grid
              size={{ xs: 2 }}
              container
              spacing={2}
            >
              <PermissionControl qualifyingPermissions={['CAN_CREATE_PEER']}>
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
              <PermissionControl qualifyingPermissions={['CAN_DELETE_PEER']}>
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
      </Link>
    );
  });

  return (
    <>
      <PermissionControl qualifyingPermissions={['CAN_GET_PEER_PROFILE']}>
        <h3>
          {t('peerList.overview.myPeerProfile')}{' '}
          <InfoTooltip text={t('peerList.overview.myPeerProfileInfo')} />
        </h3>
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
                <h5>
                  {peerInfoData?.peerProfile.name ||
                    t('peerList.panels.unnamed')}
                </h5>
                <p>{peerInfoData?.peerProfile.hostURL}</p>
                <Form.Text>
                  {t('peerList.panels.checkOwnPeerProfileHelpBlock')}{' '}
                  <a
                    href="https://wepublish.ch/peering-infos-preview/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('peerList.panels.peeringPreviewGuide')}
                  </a>
                </Form.Text>
              </AvatarWrapper>
            }
            rightChildren={
              <PermissionControl
                qualifyingPermissions={['CAN_UPDATE_PEER_PROFILE']}
              >
                <IconButtonTooltip caption={t('peerList.overview.editProfile')}>
                  <Link to="/peering/profile/edit">
                    <IconButton
                      sx={{ width: 56, height: 56 }}
                      aria-label={t('peerList.overview.editProfile')}
                    >
                      <MdSettings />
                    </IconButton>
                  </Link>
                </IconButtonTooltip>
              </PermissionControl>
            }
          />
        </Wrapper>
      </PermissionControl>

      <ListViewContainer>
        <ListViewHeader>
          <h2>
            {t('peerList.overview.peers')}{' '}
            <InfoTooltip text={t('peerList.overview.peersInfo')} />
          </h2>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_PEER']}>
          <ListViewActions>
            <Link to="/peering/create">
              <Button
                variant="contained"
                startIcon={<MdAdd />}
                disabled={isPeerListLoading}
              >
                {t('peerList.overview.newPeer')}
              </Button>
            </Link>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>
      <MarginTop>
        {peerListData?.peers?.length ?
          <List>{peers}</List>
        : !isPeerListLoading ?
          <p>{t('peerList.overview.noPeersFound')}</p>
        : null}
      </MarginTop>

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
            variant="outlined"
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
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('peerList.panels.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PEERS',
  'CAN_GET_PEER',
  'CAN_DELETE_PEER',
  'CAN_CREATE_PEER',
  'CAN_GET_PEER_PROFILE',
  'CAN_UPDATE_PEER_PROFILE',
])(PeerList);
export { CheckedPermissionComponent as PeerList };
