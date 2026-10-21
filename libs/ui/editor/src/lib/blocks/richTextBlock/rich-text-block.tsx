import { RichtextEditor } from '@wepublish/richtext/editor';
import { memo } from 'react';

import { BlockProps } from '../../atoms/blockList';
import { RichTextBlockValue } from '../types';

export interface RichTextBlockProps
  extends Omit<BlockProps<RichTextBlockValue['richText']>, 'onChange'> {
  defaultValue?: RichTextBlockProps['value'];
  onChange(value: RichTextBlockValue['richText']): void;
}

export const RichTextBlock = memo(function RichTextBlock({
  value,
  autofocus,
  disabled,
  onChange,
}: RichTextBlockProps) {
  return (
    <RichtextEditor
      autofocus={!!autofocus}
      disabled={disabled}
      value={value}
      onChange={({ json }) => onChange(json)}
    />
  );
});
