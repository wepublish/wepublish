import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderRichTextBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { BkaBlockStyle } from '../block-styles/bka-block-styles';
import { BkaDefaultRichTextBlock } from './bka-default-richtext-block';
import { BkaSidebarRichTextBlock } from './bka-sidebar-richtext-block';

export const isBkaDokumentationenRichText = (
  props: BuilderRichTextBlockProps
) => hasBlockStyle(BkaBlockStyle.Dokumentationen)(props);

export const BkaRichTextBlock = cond([
  [
    isBkaDokumentationenRichText,
    props => <BkaSidebarRichTextBlock {...props} />,
  ],
  [T, props => <BkaDefaultRichTextBlock {...props} />],
]);
