import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Card as MuiCard,
  CardContent,
  CardHeader,
  Drawer,
} from '@mui/material';
import {
  FullImageFragment,
  Maybe,
  PeerProfileDocument,
  PeerProfileQuery,
  UpdatePeerProfileDocument,
} from '@wepublish/editor/api';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form as RForm, Schema } from 'rsuite';
import { FormInstance } from 'rsuite/esm/Form';

import {
  ChooseEditImage,
  ColorPicker,
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import { InfoTooltip } from '../atoms/infoTooltip';
import { RichTextBlock, RichTextBlockValue } from '../blocks';
import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { toggleRequiredLabel } from '../toggleRequiredLabel';
import { getOperationNameFromDocument } from '../utility';
import { ImageEditPanel, ImageEditPanelProps } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

type PeerProfileImage = NonNullable<PeerProfileQuery['peerProfile']>['logo'];

const { Group, Label, Control } = RForm;

const Form = styled(RForm)`
  height: 100%;
`;

const HiddenFontControl = styled(Control)`
  display: none;
`;

const BoxWrapper = styled.div`
  border: solid 1px var(--rs-border-primary);
  border-radius: var(--rs-radius-md);
  padding: 12px;
  margin-top: 4px;
`;

const Panel = styled(MuiCard)`
  overflow: initial;
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
  } = useQuery(PeerProfileDocument, {});

  const [updateSettings, { loading: isSaving, error: saveError }] = useMutation(
    UpdatePeerProfileDocument,
    {
      refetchQueries: [getOperationNameFromDocument(PeerProfileDocument)],
    }
  );
  const isDisabled = isLoading || isSaving || !isAuthorized;

  const { t } = useTranslation();

  useEffect(() => {
    if (data?.peerProfile) {
      setLogoImage(data.peerProfile.logo);
      setSquareLogoImage(data.peerProfile.squareLogo);
      setName(data.peerProfile.name);
      setThemeColor(data.peerProfile.themeColor);
      setThemeFontColor(data.peerProfile.themeFontColor);
      setCallToActionText(data.peerProfile.callToActionText);
      setCallToActionTextURL(data.peerProfile.callToActionURL);
      setCallToActionImage(data?.peerProfile?.callToActionImage);
      setCallToActionImageURL(data.peerProfile.callToActionImageURL ?? '');
    }
  }, [data?.peerProfile]);

  useEffect(() => {
    const error = fetchError?.message ?? saveError?.message;
    if (error)
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
  }, [fetchError, saveError]);

  async function handleSave() {
    await updateSettings({
      variables: {
        name,
        logoID: logoImage!.id,
        squareLogoId: squareLogoImage!.id,
        themeColor,
        themeFontColor,
        callToActionText: callToActionText!,
        callToActionURL: callToActionTextURL,
        callToActionImageID: callToActionImage!.id,
        callToActionImageURL,
      },
    });

    enqueueSnackbar(t('peerList.panels.peerInfoUpdated'), {
      variant: 'success',
      autoHideDuration: 2000,
    });
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
      <DrawerHeader>
        <DrawerTitle>{t('peerList.panels.editPeerInfo')}</DrawerTitle>
        <DrawerActions>
          <PermissionControl
            qualifyingPermissions={['CAN_UPDATE_PEER_PROFILE']}
          >
            <Button
              variant="contained"
              disabled={isDisabled}
              type="submit"
            >
              {t('save')}
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
        <Panel>
          <CardHeader title={toggleRequiredLabel(t('peerList.panels.image'))} />

          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
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
          </CardContent>
        </Panel>

        <Panel>
          <CardHeader
            title={toggleRequiredLabel(t('peerList.panels.squareImage'))}
          />

          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
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
          </CardContent>
        </Panel>

        <Panel>
          <CardHeader title={t('peerList.panels.information')} />

          <CardContent>
            <Group controlId="peerListName">
              <Label>{toggleRequiredLabel(t('peerList.panels.name'))}</Label>
              <Control
                name="name"
                value={name}
                onChange={(value: string) => setName(value)}
              />
            </Group>
            <Group controlId="peerListThemeColor">
              <Label>
                {t('peerList.panels.themeColor')}{' '}
                <InfoTooltip text={t('peerList.panels.themeColorInfo')} />
              </Label>
              <ColorPicker
                disabled={isDisabled}
                setColor={color => {
                  setThemeColor(color);
                }}
                currentColor={themeColor}
              />
            </Group>
            <Group controlId="peerListThemeFontColor">
              <Label>{t('peerList.panels.themeFontColor')}</Label>
              <ColorPicker
                disabled={isDisabled}
                setColor={color => {
                  setThemeFontColor(color);
                }}
                currentColor={themeFontColor}
              />
            </Group>

            <Label>
              {t('peerList.panels.callToActionText')}{' '}
              <InfoTooltip text={t('peerList.panels.callToActionInfo')} />
            </Label>
            <BoxWrapper>
              <Group controlId="peerListCallToAction">
                <Label>{t('peerList.panels.text')}</Label>
                <Control
                  name="callToActionText"
                  value={callToActionText}
                  onChange={setCallToActionText}
                  accepter={RichTextBlock}
                  disabled={isDisabled}
                />
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

            <Label>
              {toggleRequiredLabel(t('peerList.panels.callToActionImage'))}
            </Label>
            <BoxWrapper>
              <Group controlId="peerListImage">
                <Label>{toggleRequiredLabel(t('peerList.panels.image'))}</Label>
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
                <Alert severity="info">
                  {t('peerList.panels.ctaImageInfo')}
                </Alert>
              </Group>
            </BoxWrapper>
          </CardContent>
        </Panel>
      </DrawerBody>

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
        open={isChooseModalOpen}
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
