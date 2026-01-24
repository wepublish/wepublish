import styled from '@emotion/styled';
import {
  Maybe,
  PeerProfileDocument,
  PeerProfileQuery,
  usePeerProfileQuery,
  useUpdatePeerProfileMutation,
} from '@wepublish/editor/api';
import { FullImageFragment } from '@wepublish/editor/api-v2';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Drawer,
  Form as RForm,
  Message as RMessage,
  Panel,
  Schema,
  toaster,
} from 'rsuite';
import { FormInstance } from 'rsuite/esm/Form';

import {
  ChooseEditImage,
  ColorPicker,
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import {
  createDefaultValue,
  RichTextBlock,
  RichTextBlockValue,
} from '../blocks';
import { toggleRequiredLabel } from '../toggleRequiredLabel';
import { getOperationNameFromDocument } from '../utility';
import { ImageEditPanel, ImageEditPanelProps } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

type PeerProfileImage = NonNullable<PeerProfileQuery['peerProfile']>['logo'];

const { Group, ControlLabel, Control } = RForm;

const Form = styled(RForm)`
  height: 100%;
`;

const HiddenFontControl = styled(Control)`
  display: none;
`;

const BoxWrapper = styled.div`
  border: solid 1px #cad5e4;
  border-radius: 8px;
  padding: 12px;
  margin-top: 4px;
`;

const Message = styled(RMessage)`
  margin-top: 5px;
`;

function PeerInfoEditPanel({ onClose, onSave }: ImageEditPanelProps) {
  const isAuthorized = useAuthorisation('CAN_UPDATE_PEER_PROFILE');
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const [logoImage, setLogoImage] = useState<PeerProfileImage>();
  const [squareLogoImage, setSquareLogoImage] = useState<PeerProfileImage>();
  const [name, setName] = useState('');
  const [themeColor, setThemeColor] = useState('');
  const [themeFontColor, setThemeFontColor] = useState('');
  const [callToActionText, setCallToActionText] =
    useState<RichTextBlockValue['richText']>();
  const [callToActionTextURL, setCallToActionTextURL] = useState('');
  const [callToActionImage, setCallToActionImage] =
    useState<Maybe<FullImageFragment>>();
  const [callToActionImageURL, setCallToActionImageURL] = useState('');
  const [whatImageChange, setWhatImageChange] = useState<
    'logo' | 'squareLogo' | 'cta'
  >();

  const {
    data,
    loading: isLoading,
    error: fetchError,
  } = usePeerProfileQuery({
    fetchPolicy: 'network-only',
  });

  const [updateSettings, { loading: isSaving, error: saveError }] =
    useUpdatePeerProfileMutation({
      refetchQueries: [getOperationNameFromDocument(PeerProfileDocument)],
    });
  const isDisabled = isLoading || isSaving || !isAuthorized;

  const { t } = useTranslation();

  useEffect(() => {
    if (data?.peerProfile) {
      setLogoImage(data.peerProfile.logo);
      setSquareLogoImage(data.peerProfile.squareLogo);
      setName(data.peerProfile.name);
      setThemeColor(data.peerProfile.themeColor);
      setThemeFontColor(data.peerProfile.themeFontColor);
      setCallToActionText(
        data.peerProfile.callToActionText.length ?
          data.peerProfile.callToActionText
        : createDefaultValue()
      );
      setCallToActionTextURL(data.peerProfile.callToActionURL);
      // @ts-expect-error wrong image type for now. Will be fixed with peer PR
      setCallToActionImage(data?.peerProfile?.callToActionImage);
      setCallToActionImageURL(data.peerProfile.callToActionImageURL ?? '');
    }
  }, [data?.peerProfile]);

  useEffect(() => {
    const error = fetchError?.message ?? saveError?.message;
    if (error)
      toaster.push(
        <RMessage
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </RMessage>
      );
  }, [fetchError, saveError]);

  async function handleSave() {
    await updateSettings({
      variables: {
        input: {
          name,
          logoID: logoImage?.id,
          squareLogoId: squareLogoImage?.id,
          themeColor,
          themeFontColor,
          callToActionText: callToActionText!,
          callToActionURL: callToActionTextURL,
          callToActionImageID: callToActionImage?.id,
          callToActionImageURL,
        },
      },
    });
    toaster.push(
      <Message
        type="success"
        showIcon
        closable
        duration={2000}
      >
        {t('peerList.panels.peerInfoUpdated')}
      </Message>
    );
    onClose?.();
  }

  const form = useRef<FormInstance>(null);
  const { StringType, ObjectType } = Schema.Types;

  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    callToActionTextURL: StringType()
      .isURL(t('errorMessages.invalidUrlErrorMessage'))
      .isRequired(t('errorMessages.noUrlErrorMessage')),
    callToActionImage: ObjectType().isRequired(
      t('errorMessages.noCallToActionImageErrorMessage')
    ),
    callToActionImageURL: StringType()
      .isURL(t('errorMessages.invalidUrlErrorMessage'))
      .isRequired(t('errorMessages.noUrlErrorMessage')),
    profileImg: StringType().isRequired(t('errorMessages.noImageErrorMessage')),
    squareProfileImg: StringType().isRequired(
      t('errorMessages.noImageErrorMessage')
    ),
  });

  return (
    <Form
      onSubmit={validationPassed => validationPassed && handleSave()}
      fluid
      disabled={isDisabled}
      ref={form}
      model={validationModel}
      formValue={{
        name,
        callToActionText,
        callToActionImage,
        callToActionTextURL,
        callToActionImageURL,
        profileImg: logoImage?.id,
        squareProfileImg: squareLogoImage?.id,
      }}
    >
      <Drawer.Header>
        <Drawer.Title>{t('peerList.panels.editPeerInfo')}</Drawer.Title>
        <Drawer.Actions>
          <PermissionControl
            qualifyingPermissions={['CAN_UPDATE_PEER_PROFILE']}
          >
            <Button
              appearance="primary"
              disabled={isDisabled}
              type="submit"
            >
              {t('save')}
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
        <Panel
          bodyFill
          header={toggleRequiredLabel(t('peerList.panels.image'))}
        >
          <ChooseEditImage
            image={logoImage}
            header={''}
            top={0}
            left={20}
            disabled={isLoading}
            openChooseModalOpen={() => {
              setWhatImageChange('logo');
              setChooseModalOpen(true);
            }}
            openEditModalOpen={() => {
              setWhatImageChange('logo');
              setEditModalOpen(true);
            }}
            removeImage={() => setLogoImage(undefined)}
          />
          <Group>
            <HiddenFontControl
              name="profileImg"
              value={logoImage?.id || ''}
            />
          </Group>
        </Panel>

        <Panel
          bodyFill
          header={toggleRequiredLabel(t('peerList.panels.squareImage'))}
        >
          <ChooseEditImage
            image={squareLogoImage}
            header={''}
            top={0}
            left={20}
            disabled={isLoading}
            openChooseModalOpen={() => {
              setWhatImageChange('squareLogo');
              setChooseModalOpen(true);
            }}
            openEditModalOpen={() => {
              setWhatImageChange('squareLogo');
              setEditModalOpen(true);
            }}
            removeImage={() => setSquareLogoImage(undefined)}
          />
          <Group>
            <HiddenFontControl
              name="squareProfileImg"
              value={squareLogoImage?.id || ''}
            />
          </Group>
        </Panel>

        <Panel header={t('peerList.panels.information')}>
          <Group controlId="peerListName">
            <ControlLabel>
              {toggleRequiredLabel(t('peerList.panels.name'))}
            </ControlLabel>
            <Control
              name="name"
              value={name}
              onChange={(value: string) => setName(value)}
            />
          </Group>
          <Group controlId="peerListThemeColor">
            <ControlLabel>{t('peerList.panels.themeColor')}</ControlLabel>
            <ColorPicker
              disabled={isDisabled}
              setColor={color => {
                setThemeColor(color);
              }}
              currentColor={themeColor}
            />
          </Group>
          <Group controlId="peerListThemeFontColor">
            <ControlLabel>{t('peerList.panels.themeFontColor')}</ControlLabel>
            <ColorPicker
              disabled={isDisabled}
              setColor={color => {
                setThemeFontColor(color);
              }}
              currentColor={themeFontColor}
            />
          </Group>

          <ControlLabel>{t('peerList.panels.callToActionText')}</ControlLabel>
          <BoxWrapper>
            <Group controlId="peerListCallToAction">
              <ControlLabel>{t('peerList.panels.text')}</ControlLabel>
              {callToActionText && (
                <Control
                  name="callToActionText"
                  value={callToActionText}
                  onChange={setCallToActionText}
                  accepter={RichTextBlock}
                  disabled={isDisabled}
                />
              )}
            </Group>
            <Group>
              <Control
                placeholder={t('peerList.panels.URL')}
                name="callToActionTextURL"
                value={callToActionTextURL}
                onChange={setCallToActionTextURL}
              />
            </Group>
          </BoxWrapper>

          <br />

          <ControlLabel>
            {toggleRequiredLabel(t('peerList.panels.callToActionImage'))}
          </ControlLabel>
          <BoxWrapper>
            <Group controlId="peerListImage">
              <ControlLabel>
                {toggleRequiredLabel(t('peerList.panels.image'))}
              </ControlLabel>
              <ChooseEditImage
                image={callToActionImage}
                header={''}
                top={0}
                left={20}
                disabled={isLoading}
                openChooseModalOpen={() => {
                  setWhatImageChange('cta');
                  setChooseModalOpen(true);
                }}
                openEditModalOpen={() => {
                  setWhatImageChange('cta');
                  setEditModalOpen(true);
                }}
                removeImage={() => setCallToActionImage(undefined)}
              />
              <HiddenFontControl
                name="callToActionImage"
                value={callToActionImage?.filename}
              />
            </Group>
            <Group>
              <Control
                placeholder={t('peerList.panels.URL')}
                name="callToActionImageURL"
                value={callToActionImageURL}
                onChange={setCallToActionImageURL}
              />
              <Message
                showIcon
                type="info"
              >
                {t('peerList.panels.ctaImageInfo')}
              </Message>
            </Group>
          </BoxWrapper>
        </Panel>
      </Drawer.Body>

      <Drawer
        open={isChooseModalOpen}
        size="sm"
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(value: any) => {
            setChooseModalOpen(false);

            switch (whatImageChange) {
              case 'cta': {
                setCallToActionImage(value);
                break;
              }
              case 'logo': {
                setLogoImage(value);
                break;
              }
              case 'squareLogo': {
                setSquareLogoImage(value);
                break;
              }
            }

            setTimeout(() => {
              form.current?.check?.();
            }, 500);
          }}
        />
      </Drawer>

      <Drawer
        open={isEditModalOpen}
        size="sm"
        onClose={() => setEditModalOpen(false)}
      >
        {(logoImage || squareLogoImage || callToActionImage) && (
          <ImageEditPanel
            id={
              whatImageChange === 'logo' ? logoImage?.id
              : whatImageChange === 'squareLogo' ?
                squareLogoImage?.id
              : callToActionImage?.id
            }
            onClose={() => setEditModalOpen(false)}
          />
        )}
      </Drawer>
    </Form>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PEER_PROFILE',
  'CAN_UPDATE_PEER_PROFILE',
])(PeerInfoEditPanel);
export { CheckedPermissionComponent as PeerInfoEditPanel };
