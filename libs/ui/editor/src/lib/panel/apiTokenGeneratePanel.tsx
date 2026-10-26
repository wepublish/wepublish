import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from '@mui/material';
import {
  ApiTokenListDocument,
  CreateApiTokenDocument,
  PermissionListDocument,
} from '@wepublish/editor/api';
import {
  CanUpdateOtherOrganizations,
  CrossOrganizationPermissions,
} from '@wepublish/permissions';
import { useContext } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';
import { z } from 'zod';

import {
  DatePicker,
  DatePickerDone,
  DatePickerFooter,
  DatePickerShortcuts,
} from '../atoms';
import { AuthContext } from '../authContext';
import {
  DrawerActions,
  DrawerBody,
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { getOperationNameFromDocument } from '../utility';
import {
  OrganizationOption,
  OrganizationSelectPicker,
} from './organizationSelectPicker';

const MAX_LIFETIME_YEARS = 3;
const RECOMMENDED_LIFETIME_YEARS = 1;

const yearsFromNow = (years: number) => {
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() + years);

  return limit;
};

const schema = z.object({
  name: z.string().min(1, 'errorMessages.noNameErrorMessage'),
  scopes: z.array(z.string()).min(1, 'apiTokenList.panels.noScopes'),
  expiresAt: z
    .date({ message: 'apiTokenList.panels.expiresRequired' })
    .refine(expiresAt => expiresAt.getTime() > Date.now(), {
      message: 'apiTokenList.panels.expiresInThePast',
    })
    .refine(expiresAt => expiresAt <= yearsFromNow(MAX_LIFETIME_YEARS), {
      message: 'apiTokenList.panels.expiresTooLate',
    }),
  organization: z.object({ id: z.string(), name: z.string() }).nullable(),
});

const EMPTY_API_TOKEN = {
  name: '',
  scopes: [] as string[],
  expiresAt: null as unknown as Date,
  organization: null as OrganizationOption | null,
};

const CROSS_ORGANIZATION = new Set<string>(
  CrossOrganizationPermissions.map(({ id }) => id)
);

const EXPIRY_PRESETS = [
  { label: 'apiTokenList.panels.in30Days', days: 30 },
  { label: 'apiTokenList.panels.in90Days', days: 90 },
  { label: 'apiTokenList.panels.inAYear', days: 365 },
  { label: 'apiTokenList.panels.in3Years', days: 365 * MAX_LIFETIME_YEARS },
];

const endOfDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(23, 59, 59, 999);

  return day;
};

const inDays = (days: number) => {
  const day = new Date();
  day.setDate(day.getDate() + days);

  return endOfDay(day);
};

const ExpiresAt = styled.div`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const Organization = styled(OrganizationSelectPicker)`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

export interface ApiTokenGeneratePanelProps {
  onClose?(): void;
}

export function ApiTokenGeneratePanel({ onClose }: ApiTokenGeneratePanelProps) {
  const { t } = useTranslation();
  const { session } = useContext(AuthContext);

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: EMPTY_API_TOKEN,
  });

  const organization = useWatch({ control, name: 'organization' });

  const { data: permissionData } = useQuery(PermissionListDocument);

  const [createApiToken, { data, loading: isCreating }] = useMutation(
    CreateApiTokenDocument,
    {
      refetchQueries: [getOperationNameFromDocument(ApiTokenListDocument)],
      onError: error =>
        enqueueSnackbar(error.message, {
          variant: 'error',
          autoHideDuration: null,
        }),
    }
  );

  const token = data?.createApiToken.token;

  const held = new Set(
    session?.sessionRoles?.flatMap(role =>
      role.permissions.map(permission => permission.id)
    ) ?? []
  );

  const grantable = (permissionData?.permissions ?? []).filter(
    permission =>
      held.has(permission.id) &&
      !(organization && CROSS_ORGANIZATION.has(permission.id))
  );

  const mayBindToAnyOrganization = held.has(CanUpdateOtherOrganizations.id);

  const copy = async () => {
    if (!token) {
      return;
    }

    await navigator.clipboard.writeText(token);
    enqueueSnackbar(t('apiTokenList.panels.copied'), { variant: 'success' });
  };

  return (
    <DrawerForm
      onSubmit={handleSubmit(
        ({ expiresAt, organization: boundTo, ...values }) =>
          createApiToken({
            variables: {
              ...values,
              expiresAt: expiresAt.toISOString(),
              organizationId: boundTo?.id ?? null,
            },
          })
      )}
    >
      <DrawerHeader>
        <DrawerTitle>{t('apiTokenList.panels.generateToken')}</DrawerTitle>

        <DrawerActions>
          {!token && (
            <Button
              type="submit"
              variant="contained"
              disabled={isCreating || !isValid}
            >
              {t('apiTokenList.panels.generate')}
            </Button>
          )}

          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('apiTokenList.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        {token ?
          <>
            <Typography>{t('apiTokenList.panels.creationSuccess')}</Typography>

            <Card
              variant="outlined"
              sx={{ my: 2 }}
            >
              <CardContent
                sx={{ wordBreak: 'break-all', '&:last-child': { pb: 0 } }}
              >
                {token}
              </CardContent>
            </Card>

            <Button
              variant="outlined"
              startIcon={<MdContentCopy />}
              onClick={copy}
            >
              {t('apiTokenList.panels.copy')}
            </Button>

            <Alert
              severity="warning"
              sx={{ mt: 2 }}
            >
              {t('apiTokenList.panels.tokenWarning')}
            </Alert>
          </>
        : <>
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('apiTokenList.panels.name')}
                  error={Boolean(error)}
                  helperText={error && t(error.message as string)}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              control={control}
              name="organization"
              render={({ field }) => (
                <Organization
                  name={field.name}
                  label={t('apiTokenList.panels.organization')}
                  helperText={t('apiTokenList.panels.organizationHelp')}
                  mine={!mayBindToAnyOrganization}
                  value={field.value}
                  onChange={picked => {
                    field.onChange(picked);

                    if (picked) {
                      setValue(
                        'scopes',
                        getValues('scopes').filter(
                          scope => !CROSS_ORGANIZATION.has(scope)
                        ),
                        { shouldValidate: true }
                      );
                    }
                  }}
                />
              )}
            />

            <Controller
              control={control}
              name="scopes"
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  multiple
                  options={grantable}
                  getOptionLabel={permission => permission.description}
                  value={grantable.filter(p => field.value.includes(p.id))}
                  onChange={(_event, selected) =>
                    field.onChange(selected.map(permission => permission.id))
                  }
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={t('apiTokenList.panels.scopes')}
                      error={Boolean(error)}
                      helperText={
                        error ?
                          t(error.message as string)
                        : t('apiTokenList.panels.scopesHelp')
                      }
                    />
                  )}
                />
              )}
            />

            <Controller
              control={control}
              name="expiresAt"
              render={({ field, fieldState: { error } }) => (
                <ExpiresAt>
                  <DatePicker
                    fullWidth
                    label={t('apiTokenList.panels.expiresAt')}
                    value={field.value ?? null}
                    onChange={expiresAt =>
                      field.onChange(expiresAt && endOfDay(expiresAt))
                    }
                    error={Boolean(error)}
                    helperText={
                      error ?
                        t(error.message as string)
                      : t('apiTokenList.panels.expiresAtHelp')
                    }
                  >
                    <DatePickerFooter>
                      <DatePickerShortcuts>
                        {EXPIRY_PRESETS.map(({ label, days }) => (
                          <Button
                            key={label}
                            size="small"
                            variant="text"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => field.onChange(inDays(days))}
                          >
                            {t(label)}
                          </Button>
                        ))}
                      </DatePickerShortcuts>

                      <DatePickerDone />
                    </DatePickerFooter>
                  </DatePicker>

                  {field.value &&
                    field.value > yearsFromNow(RECOMMENDED_LIFETIME_YEARS) && (
                      <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                      >
                        {t('apiTokenList.panels.longLivedWarning')}
                      </Alert>
                    )}
                </ExpiresAt>
              )}
            />
          </>
        }
      </DrawerBody>
    </DrawerForm>
  );
}
