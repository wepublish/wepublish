import { TextFormat } from '@wepublish/richtext';
import { BuilderRenderLeafProps } from '@wepublish/website/builder';
import { ReactNode } from 'react';

export function RenderLeaf({ element }: BuilderRenderLeafProps): ReactNode {
  if (element[TextFormat.Bold]) {
    return <strong>{element.text}</strong>;
  }

  if (element[TextFormat.Italic]) {
    return <em>{element.text}</em>;
  }

  if (element[TextFormat.Underline]) {
    return <u>{element.text}</u>;
  }

  if (element[TextFormat.Strikethrough]) {
    return <del>{element.text}</del>;
  }

  if (element[TextFormat.Superscript]) {
    return <sup>{element.text}</sup>;
  }

  if (element[TextFormat.Subscript]) {
    return <sub>{element.text}</sub>;
  }

  return element.text;
}
