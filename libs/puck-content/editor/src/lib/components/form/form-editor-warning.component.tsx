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
    <FormEditorWarning>{t('puck.form.placementWarning')}</FormEditorWarning>
  );
};

export const OwnFormWarning = () => {
  const { t } = useTranslation();
  const form = useFormContext();

  if (!form) {
    return null;
  }

  return <FormEditorWarning>{t('puck.form.ownFormWarning')}</FormEditorWarning>;
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
          {t('puck.form.nestedFormWarning')}
        </FormEditorWarning>
      )}

      {!action && (
        <FormEditorWarning>{t('puck.form.missingAction')}</FormEditorWarning>
      )}
    </>
  );
};
