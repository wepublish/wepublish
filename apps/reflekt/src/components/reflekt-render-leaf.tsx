import { capitalize, Link } from '@mui/material';
import { BuilderRenderLeafProps } from '@wepublish/website/builder';
import { useContext } from 'react';

import { RichtextVariantContext } from './reflekt-richtext-variant-context';

const buttonVariantFromLegacyId = (id?: string | null) =>
  id && id.startsWith('button-link-') ?
    id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
  : undefined;

export const ReflektRenderLeaf = ({
  mark,
  children,
}: BuilderRenderLeafProps) => {
  const variant = useContext(RichtextVariantContext);

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

  if (mark.type === 'textStyle') {
    const style = Object.fromEntries(
      Object.entries(mark.attrs ?? {}).filter(
        ([, value]) => value != null && value !== ''
      )
    );

    if (!Object.keys(style).length) {
      return children;
    }

    return <span style={style}>{children}</span>;
  }

  if (mark.type === 'link') {
    const {
      href,
      target,
      id,
      title,
      variant: markVariant,
    } = mark.attrs as typeof mark.attrs & {
      variant?: string | null;
      title?: string | null;
    };

    const url = href ?? '';
    const legacyVariant = buttonVariantFromLegacyId(id);
    const linkVariant =
      markVariant ? markVariant
      : legacyVariant ? legacyVariant
      : variant ? `link${capitalize(variant)}`
      : undefined;
    const linkTarget =
      target ??
      (url.startsWith('#') || url.startsWith('/') ? undefined : '_blank');

    return (
      <Link
        href={url}
        target={linkTarget || undefined}
        rel="noreferrer"
        title={title ?? undefined}
        data-test="link"
        variant={linkVariant as any}
      >
        {children}
      </Link>
    );
  }

  return children;
};
