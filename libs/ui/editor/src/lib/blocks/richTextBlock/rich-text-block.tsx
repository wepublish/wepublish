import { RichtextEditor } from '@wepublish/richtext/editor';
import React, { memo } from 'react';

import { BlockProps } from '../../atoms/blockList';
import { RichTextBlockValue } from '../types';

export interface RichTextBlockProps
  extends BlockProps<RichTextBlockValue['richText']> {
  defaultValue?: RichTextBlockProps['value'];
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
