import { Button } from '@mui/material';
import { useFormStatus, type AnyFormSchema } from '@wepublish/form/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { SubmitContext } from '../editor-form';
import { hasResult } from './create-result';
import { describeChanges } from './describe-changes';
import { useFormViewContext } from './form-view-context';
import type { FormConfirmation } from './use-form-controller';

type SaveButtonProps = {
  readonly intent: NonNullable<SubmitContext['intent']>;
  readonly variant: 'outlined' | 'contained';
  readonly testId: string;
  readonly children: ReactNode;
};

function SubmitButton({ intent, variant, testId, children }: SaveButtonProps) {
  const { controller } = useFormViewContext();
  const { isSubmitting, canSubmit, isDirty } = useFormStatus();
  const clean = controller.mode === 'singleton' && !isDirty;

  return (
    <Button
      variant={variant}
      type="submit"
      name="intent"
      value={intent}
      loading={isSubmitting}
      disabled={!canSubmit || clean}
      data-testid={testId}
    >
      {children}
    </Button>
  );
}

function ConfirmedSaveButton({
  intent,
  variant,
  testId,
  children,
  confirmation,
}: SaveButtonProps & {
  readonly confirmation: FormConfirmation<AnyFormSchema>;
}) {
  const { controller } = useFormViewContext();
  const { t } = useTranslation();
  const { isSubmitting, canSubmit, isDirty } = useFormStatus();

  const ask = async () => {
    const form = controller.handle.form;
    const valid = await form.trigger(undefined, { shouldFocus: true });

    if (!valid) {
      return;
    }

    confirmation.open(
      describeChanges(
        controller.view.schema,
        controller.fields,
        form,
        (key, params) => t(key, params),
        confirmation.format
      ),
      intent
    );
  };

  return (
    <Button
      variant={variant}
      type="button"
      loading={isSubmitting}
      disabled={!canSubmit || !isDirty}
      data-testid={testId}
      onClick={ask}
    >
      {children}
    </Button>
  );
}

function DiscardButton() {
  const { controller } = useFormViewContext();
  const { t } = useTranslation();
  const { isSubmitting, isDirty } = useFormStatus();

  return (
    <Button
      variant="text"
      type="button"
      disabled={!isDirty || isSubmitting}
      data-testid="discardButton"
      onClick={() => controller.handle.form.reset()}
    >
      {t('form.view.discard')}
    </Button>
  );
}

function SaveButton(props: SaveButtonProps) {
  const { controller } = useFormViewContext();
  const confirmation = controller.confirmation;

  return confirmation === undefined ?
      <SubmitButton {...props} />
    : <ConfirmedSaveButton
        {...props}
        confirmation={confirmation}
      />;
}

export function FormSaveActions() {
  const { controller } = useFormViewContext();
  const { t } = useTranslation();

  if (controller.readOnly || hasResult(controller.result)) {
    return null;
  }

  if (controller.submitLabel !== undefined) {
    return (
      <SaveButton
        intent="save"
        variant="contained"
        testId="saveButton"
      >
        {t(controller.submitLabel)}
      </SaveButton>
    );
  }

  if (controller.mode === 'singleton') {
    return (
      <>
        <DiscardButton />
        <SaveButton
          intent="save"
          variant="contained"
          testId="saveButton"
        >
          {t('save')}
        </SaveButton>
      </>
    );
  }

  return (
    <>
      <SaveButton
        intent="save"
        variant="outlined"
        testId="saveButton"
      >
        {t('save')}
      </SaveButton>
      <SaveButton
        intent="close"
        variant="contained"
        testId="saveAndCloseButton"
      >
        {t('saveAndClose')}
      </SaveButton>
    </>
  );
}
