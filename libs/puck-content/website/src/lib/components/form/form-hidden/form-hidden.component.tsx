import { PuckComponent } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';
import { MdVisibilityOff } from 'react-icons/md';

import { FormField } from '../form-field.component';
import {
  FormHiddenPlaceholder,
  FormHiddenPlaceholderLabel,
  FormHiddenPlaceholderValue,
} from './form-hidden.styles';

export type FormHiddenProps = {
  className?: string;
  name: string;
  value: string;
};

export const FormHiddenRender: PuckComponent<FormHiddenProps> = ({
  className,
  name,
  value,
  puck: { isEditing },
}) => {
  const { t } = useTranslation();

  const input = (
    <input
      type="hidden"
      name={name}
      value={value}
    />
  );

  if (!isEditing) {
    return input;
  }

  return (
    <FormField
      className={className}
      isEditing={isEditing}
    >
      {input}

      <FormHiddenPlaceholder
        variant="outlined"
        size="small"
        icon={<MdVisibilityOff aria-hidden />}
        label={
          <FormHiddenPlaceholderLabel>
            <span>{t('', 'Hidden field')}</span>
            <FormHiddenPlaceholderValue>
              {`${name} = ${value}`}
            </FormHiddenPlaceholderValue>
          </FormHiddenPlaceholderLabel>
        }
      />
    </FormField>
  );
};
