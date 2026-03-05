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
  styled,
  TextField,
} from '@mui/material';
import {
  ExternalAppFragment,
  ExternalAppsDocument,
  ExternalAppsTarget,
  useCreateExternalAppMutation,
  useDeleteExternalAppMutation,
  useUpdateExternalAppMutation,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSave } from 'react-icons/md';
import { Message, toaster } from 'rsuite';
import { z } from 'zod';

import { IconPickerSelect } from './iconPicker';

const Form = styled('form')`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
`;

const FormRow = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr;
  }
`;

const validationSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
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
    useCreateExternalAppMutation({
      refetchQueries: [ExternalAppsDocument],
    });

  const [updateExternalApp, { loading: isUpdating, error: updateError }] =
    useUpdateExternalAppMutation();

  const [deleteExternalApp, { loading: isDeleting, error: deleteError }] =
    useDeleteExternalAppMutation({
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
      url: app?.url || '',
      target: app?.target || ExternalAppsTarget.Blank,
      icon: app?.icon || '',
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const handleDelete = () => {
    if (!app) return;

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
            {t('externalAppForm.successDelete', {
              defaultValue: 'External app deleted successfully',
            })}
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
            duration={3000}
          >
            {err.message ||
              t('externalAppForm.errorDelete', {
                defaultValue: 'Failed to delete external app',
              })}
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
              {t('externalAppForm.successUpdate', {
                defaultValue: 'External app updated successfully',
              })}
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
              duration={3000}
            >
              {err.message ||
                t('externalAppForm.errorUpdate', {
                  defaultValue: 'Failed to update external app',
                })}
            </Message>,
            { placement: 'topCenter' }
          );
        });
    } else {
      createExternalApp({
        variables: {
          input: {
            name: data.name,
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
              {t('externalAppForm.successCreate', {
                defaultValue: 'External app created successfully',
              })}
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
              duration={3000}
            >
              {err.message ||
                t('externalAppForm.errorCreate', {
                  defaultValue: 'Failed to create external app',
                })}
            </Message>,
            { placement: 'topCenter' }
          );
        });
    }
  };

  return (
    <Card variant="outlined">
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
                      {target}
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

        {error && <FormHelperText error>{error.message}</FormHelperText>}

        <Box
          display="flex"
          gap={2}
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
              : t('externalAppForm.delete', { defaultValue: 'Delete' })}
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
          {t('externalAppForm.deleteConfirmationTitle', {
            defaultValue: 'Delete External App',
          })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t('externalAppForm.deleteConfirmationText', {
              defaultValue:
                'Are you sure you want to delete this external app? This action cannot be undone.',
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={loading}
          >
            {t('cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            autoFocus
            disabled={loading}
          >
            {t('externalAppForm.delete', { defaultValue: 'Delete' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
