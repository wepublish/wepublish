import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button, Card, CardContent, CardHeader } from '@mui/material';
import {
  CreatePeerDocument,
  FullRemotePeerProfileFragment,
  PeerDocument,
  PeerListDocument,
  PeerListQuery,
  RemotePeerProfileDocument,
  UpdatePeerDocument,
} from '@wepublish/editor/api';
import { RichtextJSONDocument, toPlaintext } from '@wepublish/richtext';
import { slugify } from '@wepublish/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form as RForm, Schema } from 'rsuite';

import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import { InfoTooltip } from '../atoms/infoTooltip';
import { RichTextBlock, RichTextBlockValue } from '../blocks';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { toggleRequiredLabel } from '../toggleRequiredLabel';

export interface PeerEditPanelProps {
  id?: string;
  hostURL: string;

  onClose?(): void;
  onSave?(): void;
}

const { Group, Label, Control } = RForm;

const Form = styled(RForm)`
  height: 100%;
`;

const Image = styled.img`
  object-fit: contain;
  object-position: top left;
  width: 100%;
  height: 100%;
`;

const ThemeColor = styled.div`
  display: flex;
  flex-direction: row;
`;

const ThemeColorBox = styled.div<{ themeColor: string }>`
  width: 30px;
  height: 20px;
  padding: 4px;
  margin-left: 4px;
  border: 1px solid var(--rs-border-primary);
  border-radius: var(--rs-radius-sm);
  background-color: ${({ themeColor }) => themeColor};
`;

function PeerEditPanel({ id, hostURL, onClose, onSave }: PeerEditPanelProps) {
  const isAuthorized = useAuthorisation('CAN_CREATE_PEER');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [information, setInformation] = useState<RichtextJSONDocument | null>();
  const [urlString, setURLString] = useState('');
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState<FullRemotePeerProfileFragment | null>(
    null
  );

  const {
    data,
    loading: isLoading,
    error: loadError,
  } = useQuery(PeerDocument, {
    variables: { id: id! },
    skip: !id,
  });

  const [createPeer, { loading: isCreating, error: createError }] = useMutation(
    CreatePeerDocument,
    {}
  );

  const [updatePeer, { loading: isUpdating, error: updateError }] = useMutation(
    UpdatePeerDocument,
    {}
  );

  const { refetch: fetchRemote } = useQuery(RemotePeerProfileDocument, {
    variables: { hostURL: '', token: '' },
    skip: true,
  });

  const isDisabled = isLoading || isCreating || isUpdating;
  const { t } = useTranslation();

  async function handleFetch() {
    try {
      const { data: remote } = await fetchRemote({
        hostURL: urlString,
        token,
      });
      setProfile(remote?.remotePeerProfile ? remote.remotePeerProfile : null);
    } catch (error) {
      enqueueSnackbar((error as Error).message, {
        variant: 'error',
        autoHideDuration: null,
      });
    }
  }

  useEffect(() => {
    if (data?.peer) {
      setName(data.peer.name);
      setSlug(data.peer.slug);
      setInformation(data.peer.information ?? undefined);
      setURLString(data.peer.hostURL);
      setToken(data.peer.token);
      setTimeout(() => {
        // setProfile in timeout because the useEffect that listens on
        // urlString and token will set it otherwise to null
        setProfile(data?.peer?.profile ? data.peer.profile : null);
      }, 400);
    }
  }, [data?.peer]);

  useEffect(() => {
    const error =
      loadError?.message ?? createError?.message ?? updateError?.message;
    if (error)
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
  }, [loadError, createError, updateError]);

  useEffect(() => {
    setProfile(null);
  }, [urlString, token]);

  async function handleSave() {
    if (id) {
      await updatePeer({
        variables: {
          id,
          name,
          slug,
          hostURL: new URL(urlString).toString(),
          token: token || undefined,
          information,
        },
      });
    } else {
      await createPeer({
        variables: {
          name,
          slug,
          hostURL: new URL(urlString).toString(),
          token,
          information,
        },
        update: (cache, { data }) => {
          const query = cache.readQuery<PeerListQuery>({
            query: PeerListDocument,
          });

          if (!query || !data?.createPeer) {
            return;
          }

          cache.writeQuery<PeerListQuery>({
            query: PeerListDocument,
            data: {
              __typename: 'Query',
              peers: [data.createPeer, ...query.peers],
            },
          });
        },
      });
    }
    onSave?.();
  }

  // Schema used for form validation
  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    url: StringType()
      .isRequired(t('errorMessages.noUrlErrorMessage'))
      .isURL(t('errorMessages.invalidUrlErrorMessage')),
    token:
      id ? StringType() : (
        StringType().isRequired(t('errorMessages.noTokenErrorMessage'))
      ),
  });

  return (
    <Form
      disabled={!isAuthorized}
      onSubmit={validationPassed => validationPassed && handleSave()}
      model={validationModel}
      formValue={{ name, url: urlString, token }}
    >
      <RForm.Stack fluid>
        <DrawerHeader>
          <DrawerTitle>
            {id ?
              t('peerList.panels.editPeer')
            : t('peerList.panels.createPeer')}
          </DrawerTitle>

          <DrawerActions>
            <PermissionControl qualifyingPermissions={['CAN_CREATE_PEER']}>
              <Button
                variant="contained"
                type="submit"
                data-testid="saveButton"
                disabled={isDisabled}
              >
                {id ? t('save') : t('create')}
              </Button>
            </PermissionControl>
            <Button
              variant="text"
              onClick={() => onClose?.()}
            >
              {t('peerList.panels.close')}
            </Button>
          </DrawerActions>
        </DrawerHeader>

        <DrawerBody>
          <PermissionControl
            qualifyingPermissions={
              !id ?
                ['CAN_CREATE_PEER']
              : [
                  'CAN_GET_PEER',
                  'CAN_GET_PEERS',
                  'CAN_CREATE_PEER',
                  'CAN_DELETE_PEER',
                  'CAN_GET_PEER_PROFILE',
                ]
            }
            showRejectionMessage
          >
            <Card variant="outlined">
              <CardContent>
                <Group controlId="name">
                  <Label>
                    {toggleRequiredLabel(t('peerList.panels.name'))}
                  </Label>

                  <Control
                    value={name}
                    name="name"
                    onChange={(value: string) => {
                      setName(value);
                      setSlug(slugify(value));
                    }}
                  />
                </Group>

                <Group controlId="information">
                  <Label>{t('peerList.panels.information')}</Label>
                  <Card variant="outlined">
                    <CardContent>
                      <Control
                        name="information"
                        value={information}
                        onChange={(
                          newInformation: RichTextBlockValue['richText']
                        ) => setInformation(newInformation)}
                        accepter={RichTextBlock}
                      />
                    </CardContent>
                  </Card>
                </Group>

                <Group controlId="url">
                  <Label>
                    {toggleRequiredLabel(t('peerList.panels.URL'))}{' '}
                    <InfoTooltip text={t('peerList.panels.urlInfo')} />
                  </Label>
                  <Control
                    value={urlString}
                    name="url"
                    onChange={(value: string) => {
                      setURLString(value);
                    }}
                  />
                </Group>

                <Group controlId="token">
                  <Label>
                    {toggleRequiredLabel(t('peerList.panels.token'), !id)}{' '}
                    <InfoTooltip text={t('peerList.panels.tokenInfo')} />
                  </Label>

                  <Control
                    value={token}
                    name="token"
                    placeholder={
                      id ? t('peerList.panels.leaveEmpty') : undefined
                    }
                    onChange={(value: string) => {
                      setToken(value);
                    }}
                  />
                </Group>

                <Button
                  variant="contained"
                  disabled={!isAuthorized}
                  className="fetchButton"
                  onClick={() => handleFetch()}
                >
                  {t('peerList.panels.getRemote')}
                </Button>
              </CardContent>
            </Card>

            {profile && (
              <Card variant="outlined">
                <CardHeader title={t('peerList.panels.information')} />

                <CardContent>
                  <Image
                    src={profile?.logo?.xl ?? '/static/placeholder-240x240.png'}
                  />

                  <DescriptionList>
                    <DescriptionListItem label={t('peerList.panels.name')}>
                      {profile?.name}
                    </DescriptionListItem>

                    <DescriptionListItem
                      label={t('peerList.panels.themeColor')}
                    >
                      <ThemeColor>
                        <p>{profile?.themeColor}</p>
                        <ThemeColorBox themeColor={profile.themeColor} />
                      </ThemeColor>
                    </DescriptionListItem>

                    <DescriptionListItem
                      label={t('peerList.panels.themeFontColor')}
                    >
                      <ThemeColor>
                        <p>{profile?.themeFontColor}</p>
                        <ThemeColorBox themeColor={profile?.themeFontColor} />
                      </ThemeColor>
                    </DescriptionListItem>

                    <DescriptionListItem
                      label={t('peerList.panels.callToActionText')}
                    >
                      {toPlaintext(profile?.callToActionText?.content)}
                    </DescriptionListItem>

                    <DescriptionListItem
                      label={t('peerList.panels.callToActionURL')}
                    >
                      {profile?.callToActionURL}
                    </DescriptionListItem>

                    <DescriptionListItem
                      label={t('peerList.panels.callToActionImage')}
                    >
                      <img
                        src={profile?.callToActionImage?.xsSquare ?? ''}
                        alt={t('peerList.panels.callToActionImage')}
                      />
                    </DescriptionListItem>

                    <DescriptionListItem
                      label={t('peerList.panels.callToActionImageURL')}
                    >
                      {profile?.callToActionImageURL}
                    </DescriptionListItem>
                  </DescriptionList>
                </CardContent>
              </Card>
            )}
          </PermissionControl>
        </DrawerBody>
      </RForm.Stack>
    </Form>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PEERS',
  'CAN_GET_PEER',
  'CAN_CREATE_PEER',
  'CAN_DELETE_PEER',
  'CAN_GET_PEER_PROFILE',
])(PeerEditPanel);
export { CheckedPermissionComponent as PeerEditPanel };
