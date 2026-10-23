import { EditorBlockType } from '@wepublish/editor/api';
import {
  BlockMap,
  BlockMapForValue,
  EmbedBlockListValue,
  ImageBlockListValue,
  QuoteBlockListValue,
  RichTextBlockListValue,
} from '@wepublish/ui/editor';

export type EventBlockValue =
  | RichTextBlockListValue
  | ImageBlockListValue
  | QuoteBlockListValue
  | EmbedBlockListValue;

export const eventBlockApiType = (type: EditorBlockType | string) =>
  type.charAt(0).toLowerCase() + type.slice(1);

export const EventBlockMap: BlockMapForValue<EventBlockValue> = {
  [EditorBlockType.RichText]: BlockMap[EditorBlockType.RichText],
  [EditorBlockType.Image]: BlockMap[EditorBlockType.Image],
  [EditorBlockType.Embed]: BlockMap[EditorBlockType.Embed],
  [EditorBlockType.Quote]: BlockMap[EditorBlockType.Quote],
};
