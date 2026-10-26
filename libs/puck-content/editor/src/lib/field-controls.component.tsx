import { ComponentProps } from 'react';

import { NativeSelect, SelectIcon, SelectWrapper } from './field-controls';

export const FieldSelect = (props: ComponentProps<typeof NativeSelect>) => (
  <SelectWrapper>
    <NativeSelect {...props} />

    <SelectIcon
      viewBox="0 0 10 6"
      aria-hidden="true"
    >
      <path d="M0 0h10L5 6z" />
    </SelectIcon>
  </SelectWrapper>
);
