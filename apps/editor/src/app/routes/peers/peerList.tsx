import styled from '@emotion/styled';
import {
  PeerListDocument,
  PeerListQuery,
  useDeletePeerMutation,
  usePeerListQuery,
  usePeerProfileQuery,
  useUpdatePeerMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  IconButtonTooltip,
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
import {
  Avatar as RAvatar,
  Button,
  Drawer,
  FlexboxGrid,
  Form,
  IconButton,
  List,
  Message,
  Modal,
  toaster,
} from 'rsuite';

const MarginTop = styled.div`
  margin-top: 20px;
`;

const Avatar = styled(RAvatar)`
  border: solid 2px #3498ff;
`;

const AvatarWrapper = styled.div`
  text-align: center;
`;

const Wrapper = styled.div`
  border: solid 2px #3498ff;
  padding: 10px;
  border-radius: 5px;
  margin: 1rem 0 2rem 0;
`;

const ListItem = styled(List.Item)<{ isDisabled?: boolean | null }>`
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
`;

const FlexItem = styled(FlexboxGrid.Item)`
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
  } = usePeerProfileQuery({ fetchPolicy: 'network-only' });

  const {
    data: peerListData,
    loading: isPeerListLoading,
    error: peerListError,
  } = usePeerListQuery({
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore',
  });

  const [deletePeer, { loading: isDeleting }] = useDeletePeerMutation({});
  const [updatePeer, { loading: isUpdating }] = useUpdatePeerMutation({});

  const { t } = useTranslation();

  useEffect(() => {
    const error = peerInfoError?.message ?? peerListError?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
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
          <FlexboxGrid>
            <FlexItem colspan={2}>
              <Avatar
                circle
                src={
                  profile?.squareLogo?.xxsSquare ??
                  profile?.logo?.xxsSquare ??
                  undefined
                }
                alt={profile?.name?.substr(0, 2)}
              />
            </FlexItem>
            <FlexboxGrid.Item colspan={17}>
              <h5>{name}</h5>
              <p>
                {profile && `${profile.name} - `}
                {hostURL}
              </p>
            </FlexboxGrid.Item>

            <FlexboxGrid.Item colspan={3}>
              <PermissionControl qualifyingPermissions={['CAN_CREATE_PEER']}>
                <IconButton
                  appearance="primary"
                  type="button"
                  disabled={isUpdating}
                  icon={isDisabled ? <MdVisibility /> : <MdVisibilityOff />}
                  onClick={() =>
                    updatePeer({
                      variables: { id, isDisabled: !isDisabled },
                    })
                  }
                >
                  {isDisabled ?
                    t('peerList.overview.enable')
                  : t('peerList.overview.disable')}
                </IconButton>
              </PermissionControl>
            </FlexboxGrid.Item>

            <FlexItem colspan={2}>
              <PermissionControl qualifyingPermissions={['CAN_DELETE_PEER']}>
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    disabled={isPeerInfoLoading}
                    icon={<MdDelete />}
                    circle
                    size="sm"
                    appearance="ghost"
                    color="red"
                    onClick={e => {
                      e.preventDefault();
                      setConfirmationDialogOpen(true);
                      setCurrentPeer(peer);
                    }}
                  />
                </IconButtonTooltip>
              </PermissionControl>
            </FlexItem>
          </FlexboxGrid>
        </ListItem>
      </Link>
    );
  });

  return (
    <>
      <PermissionControl qualifyingPermissions={['CAN_GET_PEER_PROFILE']}>
        <h3>{t('peerList.overview.myPeerProfile')}</h3>
        <Wrapper>
          <NavigationBar
            centerChildren={
              <AvatarWrapper>
                <Avatar
                  size="lg"
                  circle
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
                <Form.HelpText>
                  {t('peerList.panels.checkOwnPeerProfileHelpBlock')}{' '}
                  <a
                    href="https://wepublish.ch/peering-infos-preview/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('peerList.panels.peeringPreviewGuide')}
                  </a>
                </Form.HelpText>
              </AvatarWrapper>
            }
            rightChildren={
              <PermissionControl
                qualifyingPermissions={['CAN_UPDATE_PEER_PROFILE']}
              >
                <IconButtonTooltip caption={t('peerList.overview.editProfile')}>
                  <Link to="/peering/profile/edit">
                    <IconButton
                      size="lg"
                      appearance="link"
                      icon={<MdSettings />}
                      circle
                    />
                  </Link>
                </IconButtonTooltip>
              </PermissionControl>
            }
          />
        </Wrapper>
      </PermissionControl>

      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('peerList.overview.peers')}</h2>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_PEER']}>
          <ListViewActions>
            <Link to="/peering/create">
              <IconButton
                appearance="primary"
                disabled={isPeerListLoading}
                icon={<MdAdd />}
              >
                {t('peerList.overview.newPeer')}
              </IconButton>
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
        open={isPeerProfileEditModalOpen}
        size="sm"
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
        open={isEditModalOpen}
        size="sm"
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
              toaster.push(
                <Message
                  type="success"
                  showIcon
                  closable
                  duration={2000}
                >
                  {editID ?
                    t('peerList.panels.peerUpdated')
                  : t('peerList.panels.peerCreated')}
                </Message>
              );
              navigate('/peering');
            }}
          />
        )}
      </Drawer>

      <Modal
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>{t('peerList.panels.deletePeer')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('peerList.panels.name')}>
              {currentPeer?.name || t('peerList.panels.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            color="red"
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
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('peerList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
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
