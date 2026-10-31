import { PropsWithChildren, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { FormEditorHint, FormFieldWrapper } from './form-field.styles';
import { useFormContext } from './form/form.context';

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

export type FormFieldProps = PropsWithChildren<{
  className?: string;
  isEditing: boolean;
}>;

export const FormField = ({
  className,
  isEditing,
  children,
}: FormFieldProps) => {
  const { t } = useTranslation();
  const form = useFormContext();

  return (
    <FormFieldWrapper className={className}>
      {children}

      {isEditing && !form && (
        <FormEditorWarning>
          {t('', 'Place this inside a Form block')}
        </FormEditorWarning>
      )}
    </FormFieldWrapper>
  );
};
