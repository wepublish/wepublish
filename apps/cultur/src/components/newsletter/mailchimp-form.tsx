import { Box, Button, TextField } from '@mui/material';
import { useState } from 'react';

type MailchimpSubscribeFormProps = {
  signupUrl: string;
  defaultEmail?: string;
  defaultFirstName?: string;
  defaultLastName?: string;
  source?: string;
};

/**
 * The defaults come from the query string. They seed the fields once; the
 * caller keys this component on them, so a different link remounts the form
 * with the new values rather than overwriting what someone has typed. The
 * effect that used to copy props into state on every change is what the React
 * Compiler rejects (`react-hooks/set-state-in-effect`), and the key is the
 * documented way to express the same intent.
 */
export default function MailchimpSubscribeForm(
  props: MailchimpSubscribeFormProps
) {
  const { signupUrl, defaultEmail, defaultFirstName, defaultLastName, source } =
    props;
  const [email, setEmail] = useState(defaultEmail || '');
  const [firstName, setFirstName] = useState(defaultFirstName || '');
  const [lastName, setLastName] = useState(defaultLastName || '');

  return (
    <form
      action={signupUrl}
      method="post"
    >
      <Box
        sx={{
          maxWidth: 'sm',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <TextField
          placeholder="Vorname"
          variant="outlined"
          fullWidth
          name="FNAME"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          required
        />

        <TextField
          placeholder="Nachname"
          variant="outlined"
          fullWidth
          name="LNAME"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          required
        />

        <TextField
          placeholder="E-Mail-Adresse"
          variant="outlined"
          fullWidth
          type="email"
          name="EMAIL"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="hidden"
          name="SOURCE"
          value={source}
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'end',
            alignSelf: 'end',
          }}
        >
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ paddingX: 4, paddingY: 1 }}
          >
            Abonnieren
          </Button>
        </Box>
      </Box>
    </form>
  );
}
