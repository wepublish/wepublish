import {
  BuilderRenderLeafProps,
  Button,
  BuilderButtonProps,
  Link,
} from '@wepublish/website/builder';

const buttonLinkColors: Record<string, BuilderButtonProps['color']> = {
  buttonLinkMain: 'primary',
  buttonLinkSecondary: 'secondary',
};

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
    const {
      href,
      target,
      rel,
      id,
      variant,
      class: className,
    } = mark.attrs as typeof mark.attrs & {
      class?: string | null;
    };

    const buttonColor = variant ? buttonLinkColors[variant] : undefined;

    if (buttonColor) {
      return (
        <Button
          variant="contained"
          color={buttonColor}
          LinkComponent={Link}
          href={href}
          target={target}
          rel={rel}
          id={id}
          className={className ?? undefined}
        >
          {children}
        </Button>
      );
    }

    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        id={id}
        className={className ?? undefined}
      >
        {children}
      </Link>
    );
  }

  if (mark.type === 'textStyle') {
    return <span style={mark.attrs}>{children}</span>;
  }

  return children;
};
