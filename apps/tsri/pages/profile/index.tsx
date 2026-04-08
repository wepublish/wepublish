import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, TextField, Typography } from '@mui/material';
import { ProfilePage } from '@wepublish/utils/website';
import { useLoginWithEmailMutation } from '@wepublish/website/api';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import theme from '../../src/theme';

const TsriProfilePage = styled(ProfilePage)`
  &:is(SubscriptionsWrapper) {
    padding-top: ${theme.spacing(2)};
  }
`;

const ExpiredLinkWrapper = styled('div')`
  display: grid;
  gap: ${theme.spacing(3)};
  max-width: 480px;
  margin: ${theme.spacing(8)} auto;
  padding: ${theme.spacing(0, 2)};
`;

const ResendForm = styled('form')`
  display: grid;
  gap: ${theme.spacing(2)};
`;

const resendSchema = z.object({
  email: z.string().email().min(1),
});

type ResendFormValues = z.infer<typeof resendSchema>;

function ExpiredLinkView() {
  const [sendLink, { data, loading, error }] = useLoginWithEmailMutation();

  const { handleSubmit, control } = useForm<ResendFormValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  const onSubmit = handleSubmit(({ email }) => {
    sendLink({ variables: { email } }).catch(() => {
      // Prevent unhandled promise rejection (e.g. when API is unreachable
      // locally). The `error` state from the mutation hook shows the UI error.
    });
  });

  if (data) {
    return (
      <ExpiredLinkWrapper>
        <Alert severity="success">
          Falls die angegebene E-Mail-Adresse vorhanden ist, haben wir den neuen
          Link per E-Mail dorthin gesendet - bitte das Postfach prüfen.
        </Alert>
      </ExpiredLinkWrapper>
    );
  }

  return (
    <ExpiredLinkWrapper>
      <Typography
        variant="h5"
        component="h1"
      >
        Link abgelaufen
      </Typography>

      <Typography variant="body1">
        Dieser Link ist nicht mehr gültig - bitte die E-Mail-Adresse eingeben
        und einen neuen Link anfordern.
      </Typography>

      <ResendForm onSubmit={onSubmit}>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState: { error: fieldError } }) => (
            <TextField
              {...field}
              label="E-Mail-Adresse"
              type="email"
              autoComplete="email"
              fullWidth
              error={!!fieldError}
              helperText={fieldError?.message}
            />
          )}
        />

        {error && (
          <Alert severity="error">
            Etwas ist schiefgelaufen - bitte erneut versuchen.
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          fullWidth
        >
          Neuen Link anfordern
        </Button>
      </ResendForm>
    </ExpiredLinkWrapper>
  );
}

type ProfileProps = { expiredJwt?: boolean };

export default function Profile({ expiredJwt }: ProfileProps) {
  if (expiredJwt) {
    return <ExpiredLinkView />;
  }

  return (
    <TsriProfilePage
      fields={['firstName', 'address', 'password', 'image']}
      className="tsri-profile-page"
    />
  );
}

Profile.getInitialProps = ProfilePage.getInitialProps;
