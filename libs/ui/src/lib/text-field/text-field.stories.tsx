import { Link, Stack } from '@mui/material';
import { Meta, StoryObj } from '@storybook/react';

import { TextField as TextFieldCmp } from './text-field';

export default {
  component: TextFieldCmp,
  title: 'UI/TextField',
  render: () => (
    <Stack
      gap={1}
      alignItems={'start'}
    >
      <TextFieldCmp label={'Default'} />
      <TextFieldCmp
        label={'Error'}
        error
      />
      <TextFieldCmp
        label={'Disabled'}
        disabled
      />

      <br />
      <Link
        href="https://mui.com/material-ui/react-text-field/"
        target="_blank"
      >
        See more
      </Link>
    </Stack>
  ),
} as Meta<typeof TextField>;

export const TextField: StoryObj<typeof TextFieldCmp> = {};
