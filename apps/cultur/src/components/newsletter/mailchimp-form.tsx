import {Box, Button, TextField} from '@mui/material'
import React, {useEffect, useState} from 'react'

type MailchimpSubscribeFormProps = {
  signupUrl: string
  defaultEmail?: string
  defaultFirstName?: string
  defaultLastName?: string
}

export default function MailchimpSubscribeForm(props: MailchimpSubscribeFormProps) {
  const {signupUrl, defaultEmail, defaultFirstName, defaultLastName} = props
  const [email, setEmail] = useState(defaultEmail || '')
  const [firstName, setFirstName] = useState(defaultFirstName || '')
  const [lastName, setLastName] = useState(defaultLastName || '')

  useEffect(() => {
    setEmail(defaultEmail || '')
    setFirstName(defaultFirstName || '')
    setLastName(defaultLastName || '')
  }, [defaultEmail, defaultFirstName, defaultLastName])

  return (
    <form action={signupUrl} method="post">
      <Box maxWidth="sm" display={'flex'} flexDirection={'column'} gap={2}>
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

        <Box display={'flex'} flexDirection={'row'} alignItems={'end'} alignSelf={'end'}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{paddingX: 4, paddingY: 1}}>
            Abonnieren
          </Button>
        </Box>
      </Box>
    </form>
  )
}
