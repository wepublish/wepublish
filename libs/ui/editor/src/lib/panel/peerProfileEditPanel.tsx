import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Drawer, FormLabel, TextField } from '@mui/material';
import {
  FullImageFragment,
  Maybe,
  PeerProfileDocument,
  PeerProfileQuery,
  UpdatePeerProfileDocument,
} from '@wepublish/editor/api';
import {
  CanGetPeerProfile,
  CanUpdatePeerProfile,
} from '@wepublish/permissions';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

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
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
  FormFields,
  FormSectionTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { toggleRequiredLabel } from '../toggleRequiredLabel';
import { getOperationNameFromDocument } from '../utility';
import { ImageEditPanel, ImageEditPanelProps } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

type PeerProfileImage = NonNullable<PeerProfileQuery['peerProfile']>['logo'];

const EMPTY_PEER_PROFILE = {
  name: '',
  themeColor: '',
  themeFontColor: '',
  callToActionText: undefined as RichTextBlockValue['richText'] | undefined,
  callToActionTextURL: '',
  callToActionImage: undefined as Maybe<FullImageFragment> | undefined,
  callToActionImageURL: '',
  logoImage: undefined as PeerProfileImage | undefined,
  squareLogoImage: undefined as PeerProfileImage | undefined,
};

function PeerInfoEditPanel({ onClose, onSave }: ImageEditPanelProps) {
  const { t } = useTranslation();
  const isAuthorized = useAuthorisation(CanUpdatePeerProfile.id);
  const client = useApolloClient();

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [whatImageChange, setWhatImageChange] = useState<
    'logo' | 'squareLogo' | 'cta'
  >();
  const [fetchError, setFetchError] = useState<Error>();

  const schema = z.object({
    name: z.string().min(1, t('errorMessages.noNameErrorMessage')),
    themeColor: z.string(),
    themeFontColor: z.string(),
    callToActionText: z.any(),
    callToActionTextURL: z
      .string()
      .min(1, t('errorMessages.noUrlErrorMessage'))
      .url(t('errorMessages.invalidUrlErrorMessage')),
    callToActionImage: z.any().refine(image => image != null, {
      message: t('errorMessages.noCallToActionImageErrorMessage'),
    }),
    callToActionImageURL: z
      .string()
      .min(1, t('errorMessages.noUrlErrorMessage'))
      .url(t('errorMessages.invalidUrlErrorMessage')),
    logoImage: z
      .any()
      .refine(image => image != null, t('errorMessages.noImageErrorMessage')),
    squareLogoImage: z
      .any()
      .refine(image => image != null, t('errorMessages.noImageErrorMessage')),
  });

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { isLoading },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      try {
        const { data } = await client.query({ query: PeerProfileDocument });
        const peerProfile = data?.peerProfile;

        return peerProfile ?
            {
              name: peerProfile.name,
              themeColor: peerProfile.themeColor,
              themeFontColor: peerProfile.themeFontColor,
              callToActionText: peerProfile.callToActionText,
              callToActionTextURL: peerProfile.callToActionURL,
              callToActionImage: peerProfile.callToActionImage,
              callToActionImageURL: peerProfile.callToActionImageURL ?? '',
              logoImage: peerProfile.logo,
              squareLogoImage: peerProfile.squareLogo,
            }
          : EMPTY_PEER_PROFILE;
      } catch (error) {
        setFetchError(error as Error);

        return EMPTY_PEER_PROFILE;
      }
    },
  });

  const logoImage = useWatch({ control, name: 'logoImage' });
  const squareLogoImage = useWatch({ control, name: 'squareLogoImage' });
  const callToActionImage = useWatch({ control, name: 'callToActionImage' });

  const [updateSettings, { loading: isSaving, error: saveError }] = useMutation(
    UpdatePeerProfileDocument,
    {
      refetchQueries: [getOperationNameFromDocument(PeerProfileDocument)],
    }
  );
  const isDisabled = isLoading || isSaving || !isAuthorized;

  useEffect(() => {
    const error = fetchError?.message ?? saveError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [fetchError, saveError]);

  async function handleSave(values: z.infer<typeof schema>) {
    await updateSettings({
      variables: {
        name: values.name,
        logoID: values.logoImage.id,
        squareLogoId: values.squareLogoImage.id,
        themeColor: values.themeColor,
        themeFontColor: values.themeFontColor,
        callToActionText: values.callToActionText,
        callToActionURL: values.callToActionTextURL,
        callToActionImageID: values.callToActionImage.id,
        callToActionImageURL: values.callToActionImageURL,
      },
    });

    enqueueSnackbar(t('peerList.panels.peerInfoUpdated'), {
      variant: 'success',
      autoHideDuration: 2000,
    });
    onClose?.();
  }

  return (
    <DrawerForm onSubmit={handleSubmit(handleSave)}>
      <DrawerHeader>
        <DrawerTitle>{t('peerList.panels.editPeerInfo')}</DrawerTitle>
        <DrawerActions>
          <PermissionControl qualifyingPermissions={[CanUpdatePeerProfile.id]}>
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
        {!isLoading && (
          <FormFields>
            <FormLabel>
              {toggleRequiredLabel(t('peerList.panels.image'))}
            </FormLabel>

            <ChooseEditImage
              onSelect={(value: any) => {
                setChooseModalOpen(false);

                switch (whatImageChange) {
                  case 'cta': {
                    setValue('callToActionImage', value);
                    break;
                  }
                  case 'logo': {
                    setValue('logoImage', value);
                    break;
                  }
                  case 'squareLogo': {
                    setValue('squareLogoImage', value);
                    break;
                  }
                }

                trigger();
              }}
              image={logoImage}
              disabled={isLoading}
              openChooseModalOpen={() => {
                setWhatImageChange('logo');
                setChooseModalOpen(true);
              }}
              openEditModalOpen={() => {
                setWhatImageChange('logo');
                setEditModalOpen(true);
              }}
              removeImage={() => setValue('logoImage', undefined)}
            />

            <FormLabel>
              {toggleRequiredLabel(t('peerList.panels.squareImage'))}
            </FormLabel>

            <ChooseEditImage
              image={squareLogoImage}
              disabled={isLoading}
              openChooseModalOpen={() => {
                setWhatImageChange('squareLogo');
                setChooseModalOpen(true);
              }}
              openEditModalOpen={() => {
                setWhatImageChange('squareLogo');
                setEditModalOpen(true);
              }}
              removeImage={() => setValue('squareLogoImage', undefined)}
            />

            <FormSectionTitle>
              {t('peerList.panels.information')}
            </FormSectionTitle>

            <Controller
              control={control}
              name="name"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={toggleRequiredLabel(t('peerList.panels.name'))}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <div>
              <FormLabel>
                {t('peerList.panels.themeColor')}{' '}
                <InfoTooltip text={t('peerList.panels.themeColorInfo')} />
              </FormLabel>
              <Controller
                control={control}
                name="themeColor"
                render={({ field }) => (
                  <ColorPicker
                    {...field}
                    value={field.value ?? ''}
                    disabled={isDisabled}
                  />
                )}
              />
            </div>

            <div>
              <FormLabel>{t('peerList.panels.themeFontColor')}</FormLabel>
              <Controller
                control={control}
                name="themeFontColor"
                render={({ field }) => (
                  <ColorPicker
                    {...field}
                    value={field.value ?? ''}
                    disabled={isDisabled}
                  />
                )}
              />
            </div>

            <div>
              <FormLabel>
                {t('peerList.panels.callToActionText')}{' '}
                <InfoTooltip text={t('peerList.panels.callToActionInfo')} />
              </FormLabel>

              <FormFields>
                <div>
                  <FormLabel>{t('peerList.panels.text')}</FormLabel>

                  <Controller
                    control={control}
                    name="callToActionText"
                    render={({ field }) => (
                      <RichTextBlock
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isDisabled}
                      />
                    )}
                  />
                </div>

                <Controller
                  control={control}
                  name="callToActionTextURL"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      placeholder={t('peerList.panels.URL')}
                      disabled={isDisabled}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />
              </FormFields>
            </div>

            <div>
              <FormLabel>
                {toggleRequiredLabel(t('peerList.panels.callToActionImage'))}
              </FormLabel>

              <FormFields>
                <div>
                  <FormLabel>
                    {toggleRequiredLabel(t('peerList.panels.image'))}
                  </FormLabel>
                  <ChooseEditImage
                    image={callToActionImage}
                    disabled={isLoading}
                    openChooseModalOpen={() => {
                      setWhatImageChange('cta');
                      setChooseModalOpen(true);
                    }}
                    openEditModalOpen={() => {
                      setWhatImageChange('cta');
                      setEditModalOpen(true);
                    }}
                    removeImage={() => setValue('callToActionImage', undefined)}
                  />
                </div>

                <div>
                  <Controller
                    control={control}
                    name="callToActionImageURL"
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        placeholder={t('peerList.panels.URL')}
                        disabled={isDisabled}
                        error={Boolean(error)}
                        helperText={error?.message}
                        fullWidth
                      />
                    )}
                  />
                  <Alert severity="info">
                    {t('peerList.panels.ctaImageInfo')}
                  </Alert>
                </div>
              </FormFields>
            </div>
          </FormFields>
        )}
      </DrawerBody>

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
        open={isChooseModalOpen}
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(value: any) => {
            setChooseModalOpen(false);

            switch (whatImageChange) {
              case 'cta': {
                setValue('callToActionImage', value);
                break;
              }
              case 'logo': {
                setValue('logoImage', value);
                break;
              }
              case 'squareLogo': {
                setValue('squareLogoImage', value);
                break;
              }
            }

            trigger();
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
    </DrawerForm>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPeerProfile.id,
  CanUpdatePeerProfile.id,
])(PeerInfoEditPanel);
export { CheckedPermissionComponent as PeerInfoEditPanel };
