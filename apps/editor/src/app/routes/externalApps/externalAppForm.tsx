import { useMutation } from '@apollo/client/react';
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
  CreateExternalAppDocument,
  DeleteExternalAppDocument,
  ExternalAppFragment,
  ExternalAppsDocument,
  ExternalAppsTarget,
  UpdateExternalAppDocument,
} from '@wepublish/editor/api';
import { humanizeError } from '@wepublish/ui/editor';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSave } from 'react-icons/md';
import { Message, toaster } from 'rsuite';
import { z } from 'zod';

import { lazyMessage } from '../../utility';
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
});

interface ExternalAppFormProps {
  app?: ExternalAppFragment;
}

export function ExternalAppForm({ app }: ExternalAppFormProps) {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

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
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={3000}
          >
            {t('externalAppForm.successDelete')}
          </Message>,
          { placement: 'topCenter' }
        );
      })
      .catch(err => {
        console.error(err);
        setDeleteDialogOpen(false);
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
            duration={8000}
          >
            {humanizeError(err)}
          </Message>,
          { placement: 'topCenter' }
        );
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
        },
      })
        .then(() => {
          toaster.push(
            <Message
              type="success"
              showIcon
              closable
              duration={3000}
            >
              {t('externalAppForm.successUpdate')}
            </Message>,
            { placement: 'topCenter' }
          );
        })
        .catch(err => {
          console.error(err);
          toaster.push(
            <Message
              type="error"
              showIcon
              closable
              duration={8000}
            >
              {humanizeError(err)}
            </Message>,
            { placement: 'topCenter' }
          );
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
          },
        },
      })
        .then(() => {
          reset();
          toaster.push(
            <Message
              type="success"
              showIcon
              closable
              duration={3000}
            >
              {t('externalAppForm.successCreate')}
            </Message>,
            { placement: 'topCenter' }
          );
        })
        .catch(err => {
          console.error(err);
          toaster.push(
            <Message
              type="error"
              showIcon
              closable
              duration={8000}
            >
              {humanizeError(err)}
            </Message>,
            { placement: 'topCenter' }
          );
        });
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 'var(--rs-radius-lg)' }}
    >
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
