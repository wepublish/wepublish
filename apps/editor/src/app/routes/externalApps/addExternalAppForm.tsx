import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  styled,
} from '@mui/material';
import {
  ExternalAppFragment,
  ExternalAppsDocument,
  ExternalAppsTarget,
  useCreateExternalAppMutation,
  useUpdateExternalAppMutation,
} from '@wepublish/editor/api';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdEdit, MdSave } from 'react-icons/md';
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

  const [createExternalApp, { loading: isCreating, error: createError }] =
    useCreateExternalAppMutation({
      refetchQueries: [ExternalAppsDocument],
    });

  const [updateExternalApp, { loading: isUpdating, error: updateError }] =
    useUpdateExternalAppMutation();

  const loading = isCreating || isUpdating;
  const error = createError || updateError;

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
      }).catch(console.error);
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
        })
        .catch(console.error);
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
              label={t('addExternalAppForm.name')}
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
                  {t('addExternalAppForm.target')}
                </InputLabel>
                <Select
                  {...field}
                  labelId="target-label"
                  label={t('addExternalAppForm.target')}
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
                label={t('addExternalAppForm.url')}
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

        <Button
          disabled={loading}
          type="submit"
          variant={app ? 'outlined' : 'contained'}
          startIcon={app ? <MdSave /> : <MdAdd />}
        >
          {loading ?
            <CircularProgress size={24} />
          : app ?
            t('addExternalAppForm.update')
          : t('addExternalAppForm.create')}
        </Button>
      </Form>
    </Card>
  );
}
