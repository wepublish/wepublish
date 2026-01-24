import { zodResolver } from '@hookform/resolvers/zod';
import { css, InputAdornment, Theme, useTheme } from '@mui/material';
import styled from '@emotion/styled';
import {
  requiredRegisterSchema,
  UserForm,
  zodAlwaysRefine,
} from '@wepublish/authentication/website';
import { userCountryNames } from '@wepublish/user';
import {
  BuilderPersonalDataFormFields,
  BuilderPersonalDataFormProps,
  BuilderUserFormFields,
  PersonalDataFormFields,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo, useReducer, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const fullWidth = css`
  grid-column: 1 / -1;
`;

export const PersonalDataFormWrapper = styled('form')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const PersonalDataInputForm = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  grid-template-columns: 1fr;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr;
  }
`;

export const PersonalDataImageInputWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  grid-template-columns: repeat(2, 1fr);

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column-start: 1;
    grid-column-end: 3;
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const PersonalDataPasswordWrapper = styled('div')`
  position: relative;
  padding-top: ${({ theme }) => theme.spacing(6)};
  margin-top: -${({ theme }) => theme.spacing(2)};
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    ${fullWidth}
  }
`;

const passwordNoteStyles = (theme: Theme) => css`
  font-size: ${theme.typography.caption.fontSize};
  grid-column: -1/1;
`;

export const PersonalDataEmailWrapper = styled('div')`
  ${fullWidth}

  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const buttonStyles = css`
  justify-self: flex-end;
`;

const RequestEmail = styled('div')``;

const requiredSchema = requiredRegisterSchema.omit({
  challengeAnswer: true,
  email: true,
});

const defaultSchema = z.object({
  firstName: z.string().optional().or(z.literal('')),
  flair: z.string().optional().or(z.literal('')),
  birthday: z.coerce.date().max(new Date()).optional(),
  address: z.object({
    streetAddress: z.string().min(1),
    streetAddressNumber: z.string().min(1),
    zipCode: z.string().min(1),
    city: z.string().min(1),
    country: z.enum(userCountryNames),
  }),
  password: z.string().min(8).optional().or(z.literal('')),
  passwordRepeated: z.string().min(8).optional().or(z.literal('')),
  emailRepeated: z.string().email().min(1).optional().or(z.literal('')),
});

export function PersonalDataForm<T extends BuilderPersonalDataFormFields>({
  fields = ['firstName', 'flair', 'address', 'password', 'image'] as T[],
  className,
  user,
  schema = defaultSchema,
  onUpdate,
  onImageUpload,
  mediaEmail,
}: BuilderPersonalDataFormProps<T>) {
  const {
    elements: {
      TextField,
      Alert,
      Button,
      Paragraph,
      ImageUpload,
      Link,
      IconButton,
    },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [success, setSuccess] = useState(false);
  const callAction = useAsyncAction(setLoading, setError, setSuccess);
  const [showPassword, togglePassword] = useReducer(state => !state, false);
  const [showRepeatPassword, toggleRepeatPassword] = useReducer(
    state => !state,
    false
  );

  const fieldsToDisplay = useMemo(
    () =>
      fields.reduce(
        (obj, field) => ({ ...obj, [field]: true }),
        {} as Record<BuilderPersonalDataFormFields, true>
      ),
    [fields]
  );

  const validationSchema = useMemo(
    () =>
      zodAlwaysRefine(
        requiredSchema.merge(
          schema.pick({
            ...(fieldsToDisplay as any),
            passwordRepeated: fieldsToDisplay.password,
          })
        )
      ).refine(data => data.password === data.passwordRepeated, {
        message: 'Passwörter stimmen nicht überein.',
        path: ['passwordRepeated'],
      }),
    [fieldsToDisplay, schema]
  );

  const { handleSubmit, control } = useForm<PersonalDataFormFields>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      address: {
        city: user.address?.city || '',
        country: user.address?.country || '',
        streetAddress: user.address?.streetAddress || '',
        streetAddressNumber: user.address?.streetAddressNumber || '',
        zipCode: user.address?.zipCode || '',
      },
      email: user.email,
      firstName: user.firstName || '',
      name: user.name,
      flair: user.flair || '',
      birthday: user.birthday,
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(data => onUpdate && callAction(onUpdate)(data));

  const userformFields = fields.filter(field => {
    const blacklist = [
      'password',
      'passwordRepeated',
    ] as BuilderUserFormFields[];

    return !blacklist.includes(field as BuilderUserFormFields);
  }) as BuilderUserFormFields[];

  return (
    <PersonalDataFormWrapper
      className={className}
      onSubmit={onSubmit}
    >
      <PersonalDataInputForm>
        {/* todo: temporarily removed ability to change own profile picture. will be available again after v1 to v2 api migration is complete.  */}
        {false && fieldsToDisplay.image && (
          <PersonalDataImageInputWrapper>
            <ImageUpload
              image={user.image}
              onUpload={callAction(onImageUpload)}
            />
          </PersonalDataImageInputWrapper>
        )}

        <UserForm
          control={control}
          hideEmail
          fields={userformFields}
          css={fullWidth}
        />

        {fieldsToDisplay.password && (
          <PersonalDataPasswordWrapper>
            <Controller
              name={'password'}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Paragraph
                    css={passwordNoteStyles(theme)}
                    gutterBottom={false}
                  >
                    Nur ausfüllen, wenn Sie das Passwort ändern möchten.
                    Ansonsten leer lassen.
                  </Paragraph>

                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    autoComplete="new-password"
                    label={'Passwort'}
                    error={!!error}
                    helperText={error?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={togglePassword}
                            onMouseDown={event => event.preventDefault()}
                            edge="end"
                          >
                            {showPassword ?
                              <MdVisibilityOff />
                            : <MdVisibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </>
              )}
            />

            <Controller
              name={'passwordRepeated'}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  type={showRepeatPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  fullWidth
                  label={'Passwort wiederholen'}
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={toggleRepeatPassword}
                          onMouseDown={event => event.preventDefault()}
                          edge="end"
                        >
                          {showRepeatPassword ?
                            <MdVisibilityOff />
                          : <MdVisibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </PersonalDataPasswordWrapper>
        )}

        <PersonalDataEmailWrapper>
          <Controller
            name={'email'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                type={'email'}
                fullWidth
                disabled
                label={'Email (nicht bearbeitbar)'}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />

          {mediaEmail && (
            <RequestEmail>
              <Link
                href={`mailto:${mediaEmail}?subject=Email Änderung&body=Guten Tag, %0D%0A. Ich würde gerne meine Email von ${user.email} zu  >>Neue Email hier einfügen<< %0D%0A Liebe Grüsse`}
              >
                {t('user.changeEmailRequest')}
              </Link>
            </RequestEmail>
          )}
        </PersonalDataEmailWrapper>
      </PersonalDataInputForm>

      {error && <Alert severity="error">{error.message}</Alert>}
      {success && (
        <Alert severity="success">Änderungen erfolgreich gespeichert!</Alert>
      )}

      <Button
        css={buttonStyles}
        disabled={loading}
        type="submit"
      >
        Speichern
      </Button>
    </PersonalDataFormWrapper>
  );
}
