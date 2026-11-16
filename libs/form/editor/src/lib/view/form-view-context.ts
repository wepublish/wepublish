import type { AnyFormSchema } from '@wepublish/form/core';
import { createContext, useContext } from 'react';

import type { FormMode } from './form-view';
import type { FormController } from './use-form-controller';

export type FormViewContextValue = {
  readonly controller: FormController<AnyFormSchema>;
  readonly formId: string;
  readonly headingLevel: 'h2' | 'h3';
  readonly leave: (to: string) => void;
};

export const FormViewContext = createContext<FormViewContextValue | null>(null);

export type FormDrawerContextValue = {
  readonly titleId: string;
  readonly leaving: boolean;
  readonly requestClose: () => void;
  readonly setDirty: (dirty: boolean) => void;
};

export const FormDrawerContext = createContext<FormDrawerContextValue | null>(
  null
);

export function useFormViewContext(): FormViewContextValue {
  const context = useContext(FormViewContext);

  if (context === null) {
    throw new Error(
      'useFormView() works only inside a form view: FormPage, FormDrawerPanel or FormRoot.'
    );
  }

  return context;
}

export function useFormView(): {
  readonly mode: FormMode;
  readonly readOnly: boolean;
} {
  const { controller } = useFormViewContext();

  return { mode: controller.mode, readOnly: controller.readOnly };
}
