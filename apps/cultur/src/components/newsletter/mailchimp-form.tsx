import React, {useMemo, useState} from 'react'
import {TextField, Button, Box} from '@mui/material'

type MailchimpSubscribeFormProps = {
  signupUrl: string
}

export default function MailchimpSubscribeForm({signupUrl}: MailchimpSubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  return (
    <Box maxWidth="sm" display={'flex'} flexDirection={'column'}>
      <form action={signupUrl} method="post">
        <TextField
          label="Vorname"
          variant="outlined"
          fullWidth
          name="FNAME"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          required
          margin="normal"
        />

        <TextField
          label="Nachname"
          variant="outlined"
          fullWidth
          name="LNAME"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          required
          margin="normal"
        />

        <TextField
          label="E-Mail-Adresse"
          variant="outlined"
          fullWidth
          type="email"
          name="EMAIL"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          margin="normal"
        />

        <Box display={'flex'} flexDirection={'row'} alignItems={'end'}>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Abonnieren
          </Button>
        </Box>
      </form>
    </Box>
  )
}
