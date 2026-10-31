import { FormEventHandler, useMemo } from 'react';

import { PuckBlockComponent, PuckSlotValue } from '../../../blocks/block.types';
import { getSlot } from '../../../blocks/slots';
import { FormContext, FormContextValue, useFormContext } from './form.context';
import {
  FormContent,
  FormElement,
  FormHoneypot,
  NestedFormElement,
} from './form.styles';

export type FormMethod = 'post' | 'get';

export type FormTarget = '_self' | '_blank';

export type FormEncType =
  'application/x-www-form-urlencoded' | 'multipart/form-data';

export type FormProps = {
  action: string;
  method?: FormMethod;
  target?: FormTarget;
  encType?: FormEncType;
  honeypot?: string;
  content: PuckSlotValue;
};

export type FormExtra = {
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export const FormRender: PuckBlockComponent<FormProps, FormExtra> = ({
  id,
  className,
  props: { action, method, target, encType, honeypot },
  slots,
  onSubmit,
}) => {
  const parentForm = useFormContext();
  const form = useMemo<FormContextValue>(() => ({ id }), [id]);

  const content = (
    <FormContext.Provider value={form}>
      {getSlot(slots, 'content')({ as: FormContent })}
    </FormContext.Provider>
  );

  if (parentForm) {
    return (
      <NestedFormElement className={className}>{content}</NestedFormElement>
    );
  }

  return (
    <FormElement
      className={className}
      action={action || undefined}
      method={method}
      target={target}
      encType={encType}
      onSubmit={onSubmit}
    >
      {content}

      {honeypot && (
        <FormHoneypot aria-hidden="true">
          <input
            type="text"
            name={honeypot}
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </FormHoneypot>
      )}
    </FormElement>
  );
};
