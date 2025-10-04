import { ComponentProps, PropsWithChildren } from 'react';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { baseFormMapping } from '../../form/form';
import { domainFormMapping } from '../form';
import { createFormLayout } from '@wepublish/website/form-builder';
import * as v from 'valibot';
import { valibotResolver } from '@hookform/resolvers/valibot';

function Form({ children }: PropsWithChildren<{ onSubmit: () => void }>) {
  return children;
}

const SubFormInternal = createFormLayout(
  [...baseFormMapping, ...domainFormMapping] as const,
  {
    FormComponent: Form,
  }
);

export function SubForm({
  onSubmit,
  ...props
}: Omit<ComponentProps<typeof SubFormInternal>, 'form'>) {
  const form = useForm<v.InferOutput<typeof props.schema>>({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: valibotResolver(props.schema),
  });

  useEffect(() => {
    const subscription = form.watch(() =>
      form.handleSubmit(val => {
        onSubmit(val);
      })()
    );

    return () => subscription.unsubscribe();
  }, [onSubmit, form]);

  return (
    <SubFormInternal
      {...props}
      onSubmit={onSubmit}
      form={form}
    />
  );
}
