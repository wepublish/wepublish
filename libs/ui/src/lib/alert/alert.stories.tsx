import { Link, Stack } from '@mui/material';
import { Meta } from '@storybook/react';

import { Alert as AlertCmp } from './alert';

export default {
  component: AlertCmp,
  title: 'UI/Alert',
  render: () => (
    <Stack gap={1}>
      <AlertCmp severity="error">Error</AlertCmp>
      <AlertCmp severity="warning">Warning</AlertCmp>
      <AlertCmp severity="info">Info</AlertCmp>
      <AlertCmp severity="success">Success</AlertCmp>

      <br />
      <Link
        href="https://mui.com/material-ui/react-alert/"
        target="_blank"
      >
        See more
      </Link>
    </Stack>
  ),
} as Meta<typeof AlertCmp>;

export const Alert = {};
