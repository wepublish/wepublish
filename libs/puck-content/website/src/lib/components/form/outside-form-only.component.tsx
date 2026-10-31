import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { FormEditorWarning } from './form-field.component';
import { useFormContext } from './form/form.context';

export type OutsideFormOnlyProps = PropsWithChildren<{
  isEditing: boolean;
}>;

export const OutsideFormOnly = ({
  isEditing,
  children,
}: OutsideFormOnlyProps) => {
  const { t } = useTranslation();
  const form = useFormContext();

  if (!form) {
    return children;
  }

  if (!isEditing) {
    return null;
  }

  return (
    <FormEditorWarning>
      {t('', 'This block has its own form and cannot be placed inside a Form')}
    </FormEditorWarning>
  );
};
