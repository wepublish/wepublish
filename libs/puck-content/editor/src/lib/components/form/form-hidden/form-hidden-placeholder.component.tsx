import {
  FormFieldWrapper,
  FormHiddenProps,
  FormHiddenRender,
  PuckBlockComponent,
} from '@wepublish/puck-content/website';
import { MdVisibilityOff } from 'react-icons/md';

import { useEditorTranslation } from '../../../website-translations/editor-translation';
import {
  FormHiddenPlaceholder,
  FormHiddenPlaceholderLabel,
  FormHiddenPlaceholderValue,
} from './form-hidden-placeholder.styles';

export type FormHiddenEditorExtra = {
  placeholder: boolean;
};

export const FormHiddenEditorRender: PuckBlockComponent<
  FormHiddenProps,
  FormHiddenEditorExtra
> = ({ placeholder, className, ...renderProps }) => {
  const { t } = useEditorTranslation();
  const { name, value } = renderProps.props;

  if (!placeholder) {
    return (
      <FormHiddenRender
        {...renderProps}
        className={className}
      />
    );
  }

  return (
    <FormFieldWrapper className={className}>
      <FormHiddenRender {...renderProps} />

      <FormHiddenPlaceholder
        variant="outlined"
        size="small"
        icon={<MdVisibilityOff aria-hidden />}
        label={
          <FormHiddenPlaceholderLabel>
            <span>{t('puck.form.hiddenField')}</span>
            <FormHiddenPlaceholderValue>
              {`${name} = ${value}`}
            </FormHiddenPlaceholderValue>
          </FormHiddenPlaceholderLabel>
        }
      />
    </FormFieldWrapper>
  );
};
