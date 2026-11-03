import { Alert } from '@mui/material';
import {
  LoadState,
  useFormStatus,
  type AnyFormSchema,
  type FieldsProp,
} from '@wepublish/form/core';
import {
  useContext,
  useId,
  useState,
  type ElementType,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import type { EditorComponents } from '../components';
import { editorForm } from '../editor-form';
import { FormErrorSummary } from '../form-error-summary';
import { FormSections } from './form-sections';
import type { FormViewSection } from './form-view';
import {
  FormDrawerContext,
  FormViewContext,
  useFormViewContext,
} from './form-view-context';
import { Body } from './form-view-layout';
import { SaveConfirmationDialog } from './save-confirmation-dialog';
import type { FormController } from './use-form-controller';

export type FormRootProps<S extends AnyFormSchema> = {
  readonly controller: FormController<S>;
  readonly as?: ElementType;
  readonly headingLevel?: 'h2' | 'h3';
  readonly children: ReactNode;
};

function ImplicitSubmitBlocker() {
  return (
    <button
      type="submit"
      disabled
      hidden
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

function FormServerError() {
  const { serverError } = useFormStatus();

  return serverError === undefined ? null : (
      <Alert severity="error">{serverError}</Alert>
    );
}

export function FormRoot<S extends AnyFormSchema>({
  controller,
  as,
  headingLevel = 'h2',
  children,
}: FormRootProps<S>) {
  const formId = useId();
  const navigate = useNavigate();
  const drawer = useContext(FormDrawerContext);
  const [leaving, setLeaving] = useState(false);
  const erased = controller as unknown as FormController<AnyFormSchema>;
  const fields = {
    fields: erased.fields,
  } as FieldsProp<AnyFormSchema, EditorComponents>;
  const context = {
    controller: erased,
    formId,
    headingLevel,
    leave: (to: string) => {
      flushSync(() => setLeaving(true));
      navigate(to);
      setLeaving(false);
    },
  };

  return (
    <FormViewContext.Provider value={context}>
      <editorForm.Form
        form={erased.handle}
        onSubmit={erased.onSubmit}
        onInvalid={erased.onInvalid}
        disabled={erased.readOnly}
        warnOnUnsavedChanges={!leaving && (drawer === null || !drawer.leaving)}
        id={formId}
        as={as}
        {...fields}
      >
        {erased.confirmation === undefined ? null : <ImplicitSubmitBlocker />}
        {children}
      </editorForm.Form>
    </FormViewContext.Provider>
  );
}

export function FormBody() {
  const { controller } = useFormViewContext();
  const sections: readonly FormViewSection<AnyFormSchema>[] =
    controller.view.sections;
  const shown = sections.filter(
    section =>
      section.modes === undefined || section.modes.includes(controller.mode)
  );
  const wide =
    controller.view.layout === 'cards' ||
    shown.some(section => section.placement === 'aside');

  return (
    <Body data-wide={wide}>
      <FormErrorSummary />
      <FormServerError />
      <LoadState />
      <FormSections />
      {controller.confirmation === undefined ? null : (
        <SaveConfirmationDialog />
      )}
    </Body>
  );
}
