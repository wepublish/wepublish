import { useFormContext } from '@wepublish/puck-content/website';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { FormEditorHint } from './form-editor-warning.styles';

export type FormEditorWarningProps = {
  children: ReactNode;
};

export const FormEditorWarning = ({ children }: FormEditorWarningProps) => (
  <FormEditorHint
    severity="warning"
    variant="outlined"
    role="status"
  >
    {children}
  </FormEditorHint>
);

export const FormPlacementWarning = () => {
  const { t } = useTranslation();
  const form = useFormContext();

  if (form) {
    return null;
  }

  return (
    <FormEditorWarning>
      {t('', 'Place this inside a Form block')}
    </FormEditorWarning>
  );
};

export const OwnFormWarning = () => {
  const { t } = useTranslation();
  const form = useFormContext();

  if (!form) {
    return null;
  }

  return (
    <FormEditorWarning>
      {t('', 'This block has its own form and cannot be placed inside a Form')}
    </FormEditorWarning>
  );
};

export type FormHintsProps = {
  action: string;
};

export const FormHints = ({ action }: FormHintsProps) => {
  const { t } = useTranslation();
  const parentForm = useFormContext();

  return (
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
};
