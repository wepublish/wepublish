import {
  RichtextCommandItemsContext,
  RichtextEditor,
} from '@wepublish/richtext/editor';
import React, { memo, useContext } from 'react';

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
  const commandItems = useContext(RichtextCommandItemsContext);

  return (
    <RichtextEditor
      autofocus={!!autofocus}
      disabled={disabled}
      value={value}
      commandItems={commandItems}
      onChange={({ json }) => onChange(json)}
    />
  );
});
