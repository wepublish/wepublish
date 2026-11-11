import { RichtextEditor } from '@wepublish/richtext/editor';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockProps } from '../../atoms/blockList';
import { RichTextBlockValue } from '../types';

export interface RichTextBlockProps extends Omit<
  BlockProps<RichTextBlockValue['richText']>,
  'onChange'
> {
  defaultValue?: RichTextBlockProps['value'];
  onChange(value: RichTextBlockValue['richText']): void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export const RichTextBlock = memo(function RichTextBlock({
  value,
  autofocus,
  disabled,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: RichTextBlockProps) {
  const { t } = useTranslation();

  return (
    <RichtextEditor
      aria-label={
        ariaLabelledBy ? undefined : (ariaLabel ?? t('blocks.richText.label'))
      }
      aria-labelledby={ariaLabelledBy}
      autofocus={!!autofocus}
      disabled={disabled}
      value={value}
      onChange={({ json }) => onChange(json)}
    />
  );
});
