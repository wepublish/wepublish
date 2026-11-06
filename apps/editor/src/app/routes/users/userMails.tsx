import { Divider, Stack } from '@mui/material';
import {
  SendMailToUserPanel,
  UserMailLogPanel,
} from '@wepublish/membership/editor';
import { useParams } from 'react-router-dom';

export function UserMails() {
  const { id = '' } = useParams();

  return (
    <Stack spacing={2}>
      <SendMailToUserPanel userId={id} />
      <Divider />
      <UserMailLogPanel userId={id} />
    </Stack>
  );
}
