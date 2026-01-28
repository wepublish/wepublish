import * as CSS from 'csstype';
import { ElementType, forwardRef, ReactNode } from 'react';

export type TypographyVariant =
  | 'title'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body1'
  | 'body2'
  | 'subtitle1'
  | 'subtitle2';

export type TypographyTextAlign = 'left' | 'center' | 'right';
export type TypographyDisplay = 'block' | 'inline';
export type TypographySpacing = 'small' | 'large';

export interface TypographyProps extends React.ComponentPropsWithRef<'div'> {
  variant?: TypographyVariant;
  color?: string;
  align?: TypographyTextAlign;
  display?: TypographyDisplay;
  spacing?: TypographySpacing;
  ellipsize?: boolean;
  element?: ElementType<{ className?: string }>;
  children?: ReactNode;
}

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  function Typography(
    {
      variant = 'body1',
      color,
      align,
      display,
      spacing,
      ellipsize,
      element = elementForTypographyVariant(variant),
      children,
      ...props
    },
    ref
  ) {
    const Element = element as any;

    return (
      <Element
        ref={ref}
        style={{
          display,
          textAlign: align,
          color: color || undefined,
          fill: color || undefined,
          whiteSpace: ellipsize ? 'nowrap' : undefined,
          textOverflow: ellipsize ? 'ellipsis' : undefined,
          overflow: ellipsize ? 'hidden' : undefined,
          marginTop: 0,
          marginBottom: spacing ? marginForTypographySpacing(spacing) : 0,
          ...stylesForTypographyVariant(variant),
        }}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

export function elementForTypographyVariant(variant: TypographyVariant) {
  switch (variant) {
    case 'title':
      return 'h1';

    case 'h1':
      return 'h1';

    case 'h2':
      return 'h2';

    case 'h3':
      return 'h3';

    default:
      return 'p';
  }
}

export function marginForTypographySpacing(spacing: TypographySpacing): string {
  switch (spacing) {
    case 'small':
      return '0.4em';

    case 'large':
      return '0.8em';
  }
}

export interface TypographyVariantCSS {
  readonly fontSize?: CSS.Property.FontSize;
  readonly fontWeight?: CSS.Property.FontWeight;
  readonly fontStyle?: CSS.Property.FontStyle;
}

export function stylesForTypographyVariant(
  style: TypographyVariant
): TypographyVariantCSS {
  switch (style) {
    case 'title':
      return {
        fontSize: '40px',
        fontWeight: 'bold',
      };

    case 'h1':
      return {
        fontSize: '28px',
        fontWeight: 'bold',
      };

    case 'h2':
      return {
        fontSize: '24px',
        fontWeight: 'bold',
      };

    case 'h3':
      return {
        fontSize: '20px',
        fontWeight: 'bold',
      };

    case 'body1':
    case 'body2':
      return {
        fontSize: '16px',
        fontWeight: style === 'body2' ? 'bold' : undefined,
      };

    case 'subtitle1':
    case 'subtitle2':
      return {
        fontSize: '12px',
        fontStyle: style === 'subtitle2' ? 'italic' : undefined,
      };
  }
}
