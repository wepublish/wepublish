import {
  createForm,
  type SubmitContext as FormSubmitContext,
  type Translate,
} from '@wepublish/form/core';
import {
  enqueueSnackbar,
  humanizeError,
  useUnsavedChangesDialog,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { components } from './components';
import { FormLoadError, FormLoading } from './form-load-state';

const intents = ['save', 'close'] as const;

export type SubmitContext = FormSubmitContext<(typeof intents)[number]>;

function useEditorTranslate(): Translate {
  const { t } = useTranslation();

  return (key, params) => t(key, params);
}

function useEditorUnsavedChanges(dirty: boolean) {
  useUnsavedChangesDialog(dirty);
}

const reportError = (error: unknown) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

export const editorForm = createForm({
  components,
  intents,
  useTranslate: useEditorTranslate,
  as: 'form',
  Loading: FormLoading,
  LoadError: FormLoadError,
  onLoadError: reportError,
  onSubmitError: reportError,
  useUnsavedChanges: useEditorUnsavedChanges,
});
