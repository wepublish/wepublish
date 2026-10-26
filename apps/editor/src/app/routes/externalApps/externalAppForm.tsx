import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import {
  ApiTokenListDocument,
  ApiTokenStatus,
  CreateExternalAppDocument,
  DeleteExternalAppDocument,
  ExternalAppFragment,
  ExternalAppsDocument,
  ExternalAppsTarget,
  UpdateExternalAppDocument,
} from '@wepublish/editor/api';
import { CanGetApiTokens } from '@wepublish/permissions';
import {
  enqueueSnackbar,
  humanizeError,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSave } from 'react-icons/md';
import { z } from 'zod';

import { lazyMessage } from '../../utility';

import { ApiKeyWarning } from './apiKeyWarning';
import { IconPickerSelect } from './iconPicker';

const Form = styled('form')`
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px;
`;

const FormRow = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @container (min-width: 480px) {
    grid-template-columns: minmax(160px, 1fr) 2fr;
  }
`;

const validationSchema = z.object({
  name: z
    .string({ errorMap: lazyMessage('errorMessages.noNameErrorMessage') })
    .min(1),
  description: z.string().optional(),
  url: z
    .string({ errorMap: lazyMessage('errorMessages.invalidUrlErrorMessage') })
    .url(),
  target: z.nativeEnum(ExternalAppsTarget),
  icon: z.string().optional(),
  /** '' links no key */
  apiTokenId: z.string().optional(),
});

interface ExternalAppFormProps {
  app?: ExternalAppFragment;
}

export function ExternalAppForm({ app }: ExternalAppFormProps) {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // only editors who see API keys can link one; for everyone else the link
  // is left as it is
  const canLinkApiKey = useAuthorisation(CanGetApiTokens.id);
  const { data: apiTokenData } = useQuery(ApiTokenListDocument, {
    variables: { status: ApiTokenStatus.Active, take: 100 },
    skip: !canLinkApiKey,
  });

  const [createExternalApp, { loading: isCreating, error: createError }] =
    useMutation(CreateExternalAppDocument, {
      refetchQueries: [ExternalAppsDocument],
    });

  const [updateExternalApp, { loading: isUpdating, error: updateError }] =
    useMutation(UpdateExternalAppDocument);

  const [deleteExternalApp, { loading: isDeleting, error: deleteError }] =
    useMutation(DeleteExternalAppDocument, {
      refetchQueries: [ExternalAppsDocument],
    });

  const loading = isCreating || isUpdating || isDeleting;
  const error = createError || updateError || deleteError;

  const { control, handleSubmit, reset } = useForm<
    z.infer<typeof validationSchema>
  >({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: app?.name || '',
      description: app?.description || '',
      url: app?.url || '',
      target: app?.target || ExternalAppsTarget.Blank,
      icon: app?.icon || '',
      apiTokenId: app?.apiTokenId || '',
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  // the linked key stays selectable once it is no longer active
  const apiKeyOptions = useMemo(() => {
    const active = apiTokenData?.apiTokens.nodes ?? [];
    const linked = app?.apiToken;

    return linked && !active.some(({ id }) => id === linked.id) ?
        [linked, ...active]
      : active;
  }, [apiTokenData, app?.apiToken]);

  const selectedApiTokenId = useWatch({ control, name: 'apiTokenId' });
  const selectedApiKey = apiKeyOptions.find(
    ({ id }) => id === selectedApiTokenId
  );

  const apiKeyVariables = (data: z.infer<typeof validationSchema>) =>
    canLinkApiKey ? { apiTokenId: data.apiTokenId || null } : {};

  const handleDelete = () => {
    if (!app) {
      return;
    }

    deleteExternalApp({
      variables: {
        deleteExternalAppId: app.id,
      },
    })
      .then(() => {
        setDeleteDialogOpen(false);
        enqueueSnackbar(t('externalAppForm.successDelete'), {
          variant: 'success',
          autoHideDuration: 3000,
        });
      })
      .catch(err => {
        console.error(err);
        setDeleteDialogOpen(false);
        enqueueSnackbar(humanizeError(err), {
          variant: 'error',
          autoHideDuration: 8000,
        });
      });
  };

  const onSubmit = (data: z.infer<typeof validationSchema>) => {
    if (app) {
      updateExternalApp({
        variables: {
          updateExternalAppId: app.id,
          name: data.name,
          description: data.description,
          url: data.url,
          target: data.target,
          icon: data.icon,
          ...apiKeyVariables(data),
        },
      })
        .then(() => {
          enqueueSnackbar(t('externalAppForm.successUpdate'), {
            variant: 'success',
            autoHideDuration: 3000,
          });
        })
        .catch(err => {
          console.error(err);
          enqueueSnackbar(humanizeError(err), {
            variant: 'error',
            autoHideDuration: 8000,
          });
        });
    } else {
      createExternalApp({
        variables: {
          input: {
            name: data.name,
            description: data.description,
            url: data.url,
            target: data.target,
            icon: data.icon,
            ...apiKeyVariables(data),
          },
        },
      })
        .then(() => {
          reset();
          enqueueSnackbar(t('externalAppForm.successCreate'), {
            variant: 'success',
            autoHideDuration: 3000,
          });
        })
        .catch(err => {
          console.error(err);
          enqueueSnackbar(humanizeError(err), {
            variant: 'error',
            autoHideDuration: 8000,
          });
        });
    }
  };

  return (
    <Card>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t('externalAppForm.name')}
              variant="outlined"
              fullWidth
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              disabled={loading}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t('externalAppForm.description')}
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              disabled={loading}
            />
          )}
        />

        <FormRow>
          <Controller
            name="target"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl
                fullWidth
                error={!!fieldState.error}
                disabled={loading}
              >
                <InputLabel id="target-label">
                  {t('externalAppForm.target')}
                </InputLabel>
                <Select
                  {...field}
                  labelId="target-label"
                  label={t('externalAppForm.target')}
                >
                  {Object.values(ExternalAppsTarget).map(target => (
                    <MenuItem
                      key={target}
                      value={target}
                    >
                      {target === ExternalAppsTarget.Iframe ?
                        t('externalAppForm.targetIframe')
                      : t('externalAppForm.targetBlank')}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{fieldState.error?.message}</FormHelperText>
              </FormControl>
            )}
          />

          <Controller
            name="url"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={t('externalAppForm.url')}
                variant="outlined"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={loading}
              />
            )}
          />
        </FormRow>

        <Controller
          name="icon"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <IconPickerSelect
                value={field.value}
                onChange={field.onChange}
              />
              {fieldState.error && (
                <FormHelperText error>
                  {fieldState.error.message}
                </FormHelperText>
              )}
            </>
          )}
        />

        {canLinkApiKey && (
          <Controller
            name="apiTokenId"
            control={control}
            render={({ field }) => (
              <FormControl
                fullWidth
                disabled={loading}
              >
                <InputLabel id="api-key-label">
                  {t('externalAppForm.apiKey')}
                </InputLabel>
                <Select
                  {...field}
                  labelId="api-key-label"
                  label={t('externalAppForm.apiKey')}
                >
                  <MenuItem value="">{t('externalAppForm.noApiKey')}</MenuItem>
                  {apiKeyOptions.map(apiKey => (
                    <MenuItem
                      key={apiKey.id}
                      value={apiKey.id}
                    >
                      {t('externalAppForm.apiKeyOption', {
                        name: apiKey.name,
                        prefix: apiKey.prefix,
                      })}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {selectedApiKey ?
                    t('externalAppForm.apiKeyDetails', {
                      prefix: selectedApiKey.prefix,
                      scopes: selectedApiKey.scopes.length,
                      expiresAt: new Date(selectedApiKey.expiresAt),
                    })
                  : t('externalAppForm.apiKeyHelp')}
                </FormHelperText>
              </FormControl>
            )}
          />
        )}

        {app?.apiToken && selectedApiTokenId === app.apiToken.id && (
          <ApiKeyWarning apiToken={app.apiToken} />
        )}

        {error && <FormHelperText error>{humanizeError(error)}</FormHelperText>}

        <Box
          sx={{
            display: 'flex',
            gap: 2,
          }}
        >
          <Button
            disabled={loading}
            type="submit"
            variant={app ? 'outlined' : 'contained'}
            startIcon={app ? <MdSave /> : <MdAdd />}
          >
            {loading && (isCreating || isUpdating) ?
              <CircularProgress size={24} />
            : app ?
              t('externalAppForm.update')
            : t('externalAppForm.create')}
          </Button>

          {app && (
            <Button
              disabled={loading}
              color="error"
              variant="outlined"
              onClick={() => setDeleteDialogOpen(true)}
              startIcon={<MdDelete />}
            >
              {loading && isDeleting ?
                <CircularProgress size={24} />
              : t('externalAppForm.delete')}
            </Button>
          )}
        </Box>
      </Form>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {t('externalAppForm.deleteConfirmationTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t('externalAppForm.deleteConfirmationText')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            color="error"
            autoFocus
            disabled={loading}
          >
            {t('externalAppForm.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
