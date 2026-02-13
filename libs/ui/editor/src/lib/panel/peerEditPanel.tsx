import styled from '@emotion/styled';
import {
  FullRemotePeerProfileFragment,
  useCreatePeerMutation,
  usePeerQuery,
  useRemotePeerProfileQuery,
  useUpdatePeerMutation,
} from '@wepublish/editor/api';
import { slugify } from '@wepublish/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Drawer,
  Form as RForm,
  Message,
  Panel,
  Schema,
  toaster,
} from 'rsuite';
import { Descendant } from 'slate';

import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import { RichTextBlock, RichTextBlockValue } from '../blocks';
import { toggleRequiredLabel } from '../toggleRequiredLabel';

export interface PeerEditPanelProps {
  id?: string;
  hostURL: string;

  onClose?(): void;
  onSave?(): void;
}

const { Group, ControlLabel, Control } = RForm;

const Form = styled(RForm)`
  height: 100%;
`;

const ThemeColor = styled.div`
  display: flex;
  flex-direction: row;
`;

const ThemeColorBox = styled.div<{ themeColor: string }>`
  width: 30px;
  height: 20px;
  padding: 5px;
  margin-left: 5px;
  border: 1px solid #575757;
  background-color: ${({ themeColor }) => themeColor};
`;

function PeerEditPanel({ id, hostURL, onClose, onSave }: PeerEditPanelProps) {
  const isAuthorized = useAuthorisation('CAN_CREATE_PEER');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [information, setInformation] = useState<Descendant[]>();
  const [urlString, setURLString] = useState('');
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState<FullRemotePeerProfileFragment | null>(
    null
  );

  const {
    data,
    loading: isLoading,
    error: loadError,
  } = usePeerQuery({
    variables: { id: id! },
    fetchPolicy: 'network-only',
    skip: id === undefined,
  });

  const [createPeer, { loading: isCreating, error: createError }] =
    useCreatePeerMutation({});

  const [updatePeer, { loading: isUpdating, error: updateError }] =
    useUpdatePeerMutation({});

  const { refetch: fetchRemote } = useRemotePeerProfileQuery({
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
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {(error as Error).message}
        </Message>
      );
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
      fluid
      disabled={!isAuthorized}
      onSubmit={validationPassed => validationPassed && handleSave()}
      model={validationModel}
      formValue={{ name, url: urlString, token }}
    >
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('peerList.panels.editPeer') : t('peerList.panels.createPeer')}
        </Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_PEER']}>
            <Button
              type="submit"
              appearance="primary"
              data-testid="saveButton"
              disabled={isDisabled}
            >
              {id ? t('save') : t('create')}
            </Button>
          </PermissionControl>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {t('peerList.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
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
          <Panel>
            <Group controlId="name">
              <ControlLabel>
                {toggleRequiredLabel(t('peerList.panels.name'))}
              </ControlLabel>

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
              <ControlLabel>{t('peerList.panels.information')}</ControlLabel>
              <Panel bordered>
                <Control
                  name="information"
                  value={information ?? []}
                  onChange={(newInformation: RichTextBlockValue['richText']) =>
                    setInformation(newInformation)
                  }
                  accepter={RichTextBlock}
                />
              </Panel>
            </Group>

            <Group controlId="url">
              <ControlLabel>
                {toggleRequiredLabel(t('peerList.panels.URL'))}
              </ControlLabel>
              <Control
                value={urlString}
                name="url"
                onChange={(value: string) => {
                  setURLString(value);
                }}
              />
            </Group>

            <Group controlId="token">
              <ControlLabel>
                {toggleRequiredLabel(t('peerList.panels.token'), !id)}
              </ControlLabel>

              <Control
                value={token}
                name="token"
                placeholder={id ? t('peerList.panels.leaveEmpty') : undefined}
                onChange={(value: string) => {
                  setToken(value);
                }}
              />
            </Group>

            <Button
              disabled={!isAuthorized}
              className="fetchButton"
              appearance="primary"
              onClick={() => handleFetch()}
            >
              {t('peerList.panels.getRemote')}
            </Button>
          </Panel>

          {profile && (
            <Panel header={t('peerList.panels.information')}>
              <ChooseEditImage
                disabled
                image={profile?.logo}
              />

              <DescriptionList>
                <DescriptionListItem label={t('peerList.panels.name')}>
                  {profile?.name}
                </DescriptionListItem>

                <DescriptionListItem label={t('peerList.panels.themeColor')}>
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
                  {!!profile?.callToActionText && (
                    <RichTextBlock
                      disabled
                      displayOnly
                      // TODO: remove this
                      onChange={console.log}
                      value={profile.callToActionText}
                    />
                  )}
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
                    src={profile?.callToActionImage?.url || undefined}
                    alt={t('peerList.panels.callToActionImage')}
                  />
                </DescriptionListItem>

                <DescriptionListItem
                  label={t('peerList.panels.callToActionImageURL')}
                >
                  {profile?.callToActionImageURL}
                </DescriptionListItem>
              </DescriptionList>
            </Panel>
          )}
        </PermissionControl>
      </Drawer.Body>
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
