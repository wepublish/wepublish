import { ComponentProps, PropsWithChildren } from 'react';
import { useFormContext } from 'react-hook-form';
import { baseFormMapping } from '../../form/form';
import { domainFormMapping } from '../form';
import { createFormLayout } from '@wepublish/website/form-builder';

function Form({ children }: PropsWithChildren<{ onSubmit: () => void }>) {
  return children;
}

const SubFormInternal = createFormLayout(
  [...baseFormMapping, ...domainFormMapping] as const,
  {
    FormComponent: Form,
  }
);

export function SubForm(
  props: Omit<ComponentProps<typeof SubFormInternal>, 'form' | 'onSubmit'>
) {
  const form = useFormContext();

  return (
    <SubFormInternal
      {...props}
      form={form}
      onSubmit={() => {
        // not needed
      }}
    />
  );
}
