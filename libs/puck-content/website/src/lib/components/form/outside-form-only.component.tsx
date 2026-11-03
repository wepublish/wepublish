import { PropsWithChildren } from 'react';

import { useFormContext } from './form/form.context';

export type OutsideFormOnlyProps = PropsWithChildren;

export const OutsideFormOnly = ({ children }: OutsideFormOnlyProps) => {
  const form = useFormContext();

  if (form) {
    return null;
  }

  return children;
};
