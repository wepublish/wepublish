import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormLabel, Stack, TextField, Typography } from '@mui/material';
import {
  CreatePeerDocument,
  FullRemotePeerProfileFragment,
  PeerDocument,
  PeerListDocument,
  PeerListQuery,
  RemotePeerProfileDocument,
  UpdatePeerDocument,
} from '@wepublish/editor/api';
import {
  CanCreatePeer,
  CanDeletePeer,
  CanGetPeer,
  CanGetPeerProfile,
  CanGetPeers,
} from '@wepublish/permissions';
import { RichtextJSONDocument, toPlaintext } from '@wepublish/richtext';
import { slugify } from '@wepublish/utils';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

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
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
  FormFields,
  FormSectionTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { toggleRequiredLabel } from '../toggleRequiredLabel';

export interface PeerEditPanelProps {
  id?: string;
  hostURL: string;

  onClose?(): void;
  onSave?(): void;
}

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
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.5)`};
  background-color: ${({ themeColor }) => themeColor};
`;

const EMPTY_PEER = {
  name: '',
  slug: '',
  information: null as RichtextJSONDocument | null,
  url: '',
  token: '',
  profile: null as FullRemotePeerProfileFragment | null,
};

function PeerEditPanel({ id, hostURL, onClose, onSave }: PeerEditPanelProps) {
  const { t } = useTranslation();
  const isAuthorized = useAuthorisation(CanCreatePeer.id);
  const client = useApolloClient();
  const [loadError, setLoadError] = useState<Error>();

  const schema = z.object({
    name: z.string().min(1, t('errorMessages.noNameErrorMessage')),
    slug: z.string(),
    information: z.any(),
    url: z
      .string()
      .min(1, t('errorMessages.noUrlErrorMessage'))
      .url(t('errorMessages.invalidUrlErrorMessage')),
    token:
      id ?
        z.string().optional()
      : z.string().min(1, t('errorMessages.noTokenErrorMessage')),
    profile: z.any(),
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isLoading },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      if (!id) {
        return EMPTY_PEER;
      }

      try {
        const { data } = await client.query({
          query: PeerDocument,
          variables: { id },
        });
        const peer = data?.peer;

        return peer ?
            {
              name: peer.name,
              slug: peer.slug,
              information: peer.information ?? null,
              url: peer.hostURL,
              token: peer.token,
              profile: peer.profile ?? null,
            }
          : EMPTY_PEER;
      } catch (error) {
        setLoadError(error as Error);

        return EMPTY_PEER;
      }
    },
  });

  const profile = useWatch({ control, name: 'profile' });
  const url = useWatch({ control, name: 'url' });
  const token = useWatch({ control, name: 'token' });

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

  async function handleFetch() {
    try {
      const { data: remote } = await fetchRemote({
        hostURL: url,
        token: token ?? '',
      });
      setValue(
        'profile',
        remote?.remotePeerProfile ? remote.remotePeerProfile : null
      );
    } catch (error) {
      enqueueSnackbar((error as Error).message, {
        variant: 'error',
        autoHideDuration: null,
      });
    }
  }

  useEffect(() => {
    const error =
      loadError?.message ?? createError?.message ?? updateError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [loadError, createError, updateError]);

  async function handleSave({
    name,
    slug,
    information,
    url,
    token,
  }: z.infer<typeof schema>) {
    if (id) {
      await updatePeer({
        variables: {
          id,
          name,
          slug,
          hostURL: new URL(url).toString(),
          token: token || undefined,
          information,
        },
      });
    } else {
      await createPeer({
        variables: {
          name,
          slug,
          hostURL: new URL(url).toString(),
          token: token ?? '',
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

  return (
    <DrawerForm onSubmit={handleSubmit(handleSave)}>
      <Stack
        direction="column"
        sx={{ height: '100%' }}
      >
        <DrawerHeader>
          <DrawerTitle>
            {id ?
              t('peerList.panels.editPeer')
            : t('peerList.panels.createPeer')}
          </DrawerTitle>

          <DrawerActions>
            <PermissionControl qualifyingPermissions={[CanCreatePeer.id]}>
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
          {!isLoading && (
            <PermissionControl
              qualifyingPermissions={
                !id ?
                  [CanCreatePeer.id]
                : [
                    CanGetPeer.id,
                    CanGetPeers.id,
                    CanCreatePeer.id,
                    CanDeletePeer.id,
                    CanGetPeerProfile.id,
                  ]
              }
              showRejectionMessage
            >
              <FormFields>
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label={toggleRequiredLabel(t('peerList.panels.name'))}
                      disabled={!isAuthorized}
                      onChange={event => {
                        field.onChange(event);
                        setValue('slug', slugify(event.target.value));
                      }}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />

                <div>
                  <FormLabel>{t('peerList.panels.information')}</FormLabel>

                  <Controller
                    control={control}
                    name="information"
                    render={({ field }) => (
                      <RichTextBlock
                        value={field.value}
                        onChange={newInformation =>
                          field.onChange(
                            newInformation as RichTextBlockValue['richText']
                          )
                        }
                      />
                    )}
                  />
                </div>

                <Controller
                  control={control}
                  name="url"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label={
                        <>
                          {toggleRequiredLabel(t('peerList.panels.URL'))}{' '}
                          <InfoTooltip text={t('peerList.panels.urlInfo')} />
                        </>
                      }
                      disabled={!isAuthorized}
                      onChange={event => {
                        field.onChange(event);
                        setValue('profile', null);
                      }}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="token"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label={
                        <>
                          {toggleRequiredLabel(t('peerList.panels.token'), !id)}{' '}
                          <InfoTooltip text={t('peerList.panels.tokenInfo')} />
                        </>
                      }
                      disabled={!isAuthorized}
                      placeholder={
                        id ? t('peerList.panels.leaveEmpty') : undefined
                      }
                      onChange={event => {
                        field.onChange(event);
                        setValue('profile', null);
                      }}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />

                <div>
                  <Button
                    variant="contained"
                    disabled={!isAuthorized}
                    onClick={() => handleFetch()}
                  >
                    {t('peerList.panels.getRemote')}
                  </Button>
                </div>

                {profile && (
                  <>
                    <FormSectionTitle>
                      {t('peerList.panels.information')}
                    </FormSectionTitle>

                    <Image
                      src={
                        profile?.logo?.xl ?? '/static/placeholder-240x240.png'
                      }
                    />

                    <DescriptionList>
                      <DescriptionListItem label={t('peerList.panels.name')}>
                        {profile?.name}
                      </DescriptionListItem>

                      <DescriptionListItem
                        label={t('peerList.panels.themeColor')}
                      >
                        <ThemeColor>
                          <Typography>{profile?.themeColor}</Typography>
                          <ThemeColorBox themeColor={profile.themeColor} />
                        </ThemeColor>
                      </DescriptionListItem>

                      <DescriptionListItem
                        label={t('peerList.panels.themeFontColor')}
                      >
                        <ThemeColor>
                          <Typography>{profile?.themeFontColor}</Typography>
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
                  </>
                )}
              </FormFields>
            </PermissionControl>
          )}
        </DrawerBody>
      </Stack>
    </DrawerForm>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPeers.id,
  CanGetPeer.id,
  CanCreatePeer.id,
  CanDeletePeer.id,
  CanGetPeerProfile.id,
])(PeerEditPanel);
export { CheckedPermissionComponent as PeerEditPanel };
