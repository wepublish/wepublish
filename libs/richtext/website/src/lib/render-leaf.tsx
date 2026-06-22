import { BuilderRenderLeafProps, Link } from '@wepublish/website/builder';

export const RenderLeaf = ({ mark, children }: BuilderRenderLeafProps) => {
  if (mark.type === 'bold') {
    return <strong>{children}</strong>;
  }

  if (mark.type === 'italic') {
    return <em>{children}</em>;
  }

  if (mark.type === 'underline') {
    return <u>{children}</u>;
  }

  if (mark.type === 'strike') {
    return <del>{children}</del>;
  }

  if (mark.type === 'superscript') {
    return <sup>{children}</sup>;
  }

  if (mark.type === 'subscript') {
    return <sub>{children}</sub>;
  }

  if (mark.type === 'link') {
    return <Link {...mark.attrs}>{children}</Link>;
  }

  if (mark.type === 'textStyle') {
    return <span style={mark.attrs}>{children}</span>;
  }

  return children;
};
