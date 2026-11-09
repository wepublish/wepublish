import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Drawer,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
} from '@mui/material';
import {
  CreatePaymentMethodDocument,
  FullImageFragment,
  FullPaymentMethodFragment,
  PaymentMethodDocument,
  PaymentProviderListDocument,
  UpdatePaymentMethodDocument,
} from '@wepublish/editor/api';
import {
  CanCreatePaymentMethod,
  CanDeletePaymentMethod,
  CanGetPaymentMethod,
  CanGetPaymentMethods,
} from '@wepublish/permissions';
import { slugify } from '@wepublish/utils';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import { InfoTooltip } from '../atoms/infoTooltip';
import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
  FormFields,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { ImageSelectPanel } from './imageSelectPanel';

export interface PaymentMethodEditPanelProps {
  id?: string;

  onClose?(): void;
  onSave?(paymentMethod: FullPaymentMethodFragment): void;
}

const EMPTY_PAYMENT_METHOD = {
  name: '',
  slug: '',
  description: '',
  active: true,
  gracePeriod: 0,
  paymentProviderID: '',
  image: undefined as FullImageFragment | undefined,
};

const toFormValues = (
  paymentMethod: FullPaymentMethodFragment
): typeof EMPTY_PAYMENT_METHOD => ({
  name: paymentMethod.name,
  slug: paymentMethod.slug,
  description: paymentMethod.description,
  active: paymentMethod.active,
  gracePeriod: paymentMethod.gracePeriod,
  paymentProviderID: paymentMethod.paymentProvider?.id ?? '',
  image: paymentMethod.image ?? undefined,
});

function PaymentMethodEditPanel({
  id,
  onClose,
  onSave,
}: PaymentMethodEditPanelProps) {
  const { t } = useTranslation();

  const isAuthorized = useAuthorisation(CanCreatePaymentMethod.id);

  const [imageSelectionOpen, setImageSelectionOpen] = useState(false);

  const schema = z.object({
    name: z.string().min(1, t('errorMessages.noNameErrorMessage')),
    slug: z.string(),
    description: z.string(),
    active: z.boolean(),
    gracePeriod: z.number(),
    paymentProviderID: z
      .string()
      .min(1, t('errorMessages.noPaymentProviderErrorMessage')),
    image: z.custom<FullImageFragment>().optional(),
  });

  const client = useApolloClient();
  const [loadError, setLoadError] = useState<Error>();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isLoading },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      if (!id) {
        return EMPTY_PAYMENT_METHOD;
      }

      try {
        const { data } = await client.query({
          query: PaymentMethodDocument,
          variables: { id },
        });

        return data?.paymentMethod ?
            toFormValues(data.paymentMethod)
          : EMPTY_PAYMENT_METHOD;
      } catch (error) {
        setLoadError(error as Error);

        return EMPTY_PAYMENT_METHOD;
      }
    },
  });

  const {
    data: paymentProviderData,
    loading: isLoadingPaymentProvider,
    error: loadPaymentProviderError,
  } = useQuery(PaymentProviderListDocument, {});

  const paymentProviders = paymentProviderData?.paymentProviders ?? [];

  const [createPaymentMethod, { loading: isCreating, error: createError }] =
    useMutation(CreatePaymentMethodDocument);

  const [updatePaymentMethod, { loading: isUpdating, error: updateError }] =
    useMutation(UpdatePaymentMethodDocument);

  const isDisabled =
    isLoading ||
    isCreating ||
    isUpdating ||
    isLoadingPaymentProvider ||
    loadError !== undefined ||
    loadPaymentProviderError !== undefined ||
    !isAuthorized;

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      loadPaymentProviderError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [loadError, createError, updateError, loadPaymentProviderError]);

  async function handleSave(values: z.infer<typeof schema>) {
    const { image: chosen, ...fields } = values;

    if (id) {
      const { data } = await updatePaymentMethod({
        variables: { id, ...fields, imageId: chosen?.id },
      });

      if (data?.updatePaymentMethod) {
        onSave?.(data.updatePaymentMethod);
      }
    } else {
      const { data } = await createPaymentMethod({ variables: fields });

      if (data?.createPaymentMethod) {
        onSave?.(data.createPaymentMethod);
      }
    }
  }

  return (
    <>
      <DrawerForm
        noValidate
        onSubmit={handleSubmit(handleSave)}
      >
        <DrawerHeader>
          <DrawerTitle>
            {id ?
              t('paymentMethodList.editTitle')
            : t('paymentMethodList.createTitle')}
          </DrawerTitle>

          <DrawerActions>
            <PermissionControl
              qualifyingPermissions={[CanCreatePaymentMethod.id]}
            >
              <Button
                variant="contained"
                disabled={isDisabled}
                type="submit"
              >
                {id ? t('save') : t('create')}
              </Button>
            </PermissionControl>

            <Button
              variant="text"
              onClick={() => onClose?.()}
            >
              {t('close')}
            </Button>
          </DrawerActions>
        </DrawerHeader>

        <DrawerBody>
          {!isLoading && (
            <FormFields>
              <FormLabel>{t('paymentMethodList.selectImage')}</FormLabel>

              <Controller
                control={control}
                name="image"
                render={({ field }) => (
                  <ChooseEditImage
                    onSelect={(image: FullImageFragment) => {
                      setValue('image', image);
                      setImageSelectionOpen(false);
                    }}
                    image={field.value}
                    disabled={false}
                    openChooseModalOpen={() => setImageSelectionOpen(true)}
                    removeImage={() => field.onChange(undefined)}
                    maxHeight={200}
                  />
                )}
              />

              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('paymentMethodList.name')}
                    required
                    disabled={isDisabled}
                    onChange={event => {
                      field.onChange(event);
                      setValue('slug', slugify(event.target.value));
                    }}
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                control={control}
                name="slug"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={
                      <>
                        {t('paymentMethodList.slug')}{' '}
                        <InfoTooltip text={t('paymentMethodList.slugInfo')} />
                      </>
                    }
                    slotProps={{ input: { readOnly: true } }}
                    fullWidth
                  />
                )}
              />

              <FormControlLabel
                control={
                  <Controller
                    control={control}
                    name="active"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        disabled={isDisabled}
                        onChange={(_event, value) => field.onChange(value)}
                      />
                    )}
                  />
                }
                label={
                  <>
                    {t('paymentMethodList.active')}{' '}
                    <InfoTooltip
                      text={t('paymentMethodList.activeDescription')}
                    />
                  </>
                }
              />

              <Controller
                control={control}
                name="paymentProviderID"
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    required
                    label={
                      <>
                        {t('paymentMethodList.adapter')}{' '}
                        <InfoTooltip
                          text={t('paymentMethodList.adapterInfo')}
                        />
                      </>
                    }
                    disabled={isDisabled}
                    error={Boolean(errors.paymentProviderID)}
                    helperText={errors.paymentProviderID?.message}
                    fullWidth
                  >
                    {paymentProviders.map(provider => (
                      <MenuItem
                        key={provider.id}
                        value={provider.id}
                      >
                        {provider.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('paymentMethodList.description')}
                    disabled={isDisabled}
                    fullWidth
                  />
                )}
              />

              <Controller
                control={control}
                name="gracePeriod"
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t('paymentMethodEditPanel.gracePeriod')}
                    disabled={isDisabled}
                    onChange={event => field.onChange(+event.target.value)}
                    helperText={t('paymentMethodEditPanel.gracePeriodHelpText')}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            {t('paymentMethodEditPanel.days')}
                          </InputAdornment>
                        ),
                      },
                    }}
                    fullWidth
                  />
                )}
              />
            </FormFields>
          )}
        </DrawerBody>
      </DrawerForm>

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
        open={imageSelectionOpen}
        onClose={() => {
          setImageSelectionOpen(false);
        }}
      >
        <ImageSelectPanel
          onClose={() => setImageSelectionOpen(false)}
          onSelect={(image: FullImageFragment) => {
            setValue('image', image);
            setImageSelectionOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPaymentMethod.id,
  CanGetPaymentMethods.id,
  CanCreatePaymentMethod.id,
  CanDeletePaymentMethod.id,
])(PaymentMethodEditPanel);
export { CheckedPermissionComponent as PaymentMethodEditPanel };
