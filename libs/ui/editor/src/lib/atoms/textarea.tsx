import { ComponentProps, forwardRef } from 'react';
import { Input } from 'rsuite';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<typeof Input>
>((props, ref) => (
  <Input
    {...props}
    as="textarea"
    ref={ref}
  />
));
