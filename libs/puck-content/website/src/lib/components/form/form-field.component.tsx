import { PropsWithChildren } from 'react';

import { FormFieldWrapper } from './form-field.styles';

export type FormFieldProps = PropsWithChildren<{
  className?: string;
}>;

export const FormField = ({ className, children }: FormFieldProps) => (
  <FormFieldWrapper className={className}>{children}</FormFieldWrapper>
);
