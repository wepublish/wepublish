import { PuckComponent, Slot } from '@puckeditor/core';
import { SyntheticEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { FormEditorWarning } from '../form-field.component';
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
  className?: string;
  action: string;
  method?: FormMethod;
  target?: FormTarget;
  encType?: FormEncType;
  honeypot?: string;
  content: Slot;
};

const preventSubmit = (event: SyntheticEvent) => event.preventDefault();

export const FormRender: PuckComponent<FormProps> = ({
  id,
  className,
  action,
  method,
  target,
  encType,
  honeypot,
  content: Content,
  puck: { isEditing },
}) => {
  const { t } = useTranslation();
  const parentForm = useFormContext();
  const form = useMemo<FormContextValue>(() => ({ id }), [id]);

  const hints = isEditing && (
    <>
      {parentForm && (
        <FormEditorWarning>
          {t('', 'Forms cannot be placed inside another Form')}
        </FormEditorWarning>
      )}

      {!action && (
        <FormEditorWarning>
          {t('', 'Set an action URL so the form knows where to send its data')}
        </FormEditorWarning>
      )}
    </>
  );

  const content = (
    <FormContext.Provider value={form}>
      <Content
        as={FormContent}
        minEmptyHeight={120}
      />
    </FormContext.Provider>
  );

  if (parentForm) {
    return (
      <NestedFormElement className={className}>
        {hints}
        {content}
      </NestedFormElement>
    );
  }

  return (
    <FormElement
      className={className}
      action={action || undefined}
      method={method}
      target={target}
      encType={encType}
      onSubmit={isEditing ? preventSubmit : undefined}
    >
      {hints}
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
