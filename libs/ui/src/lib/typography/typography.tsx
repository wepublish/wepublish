import { Link as MuiLink, LinkTypeMap, Typography } from '@mui/material';
import { AnchorHTMLAttributes, forwardRef, HTMLAttributes } from 'react';

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  component?: React.ElementType;
  gutterBottom?: boolean;
};

export const H1 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, ...props }, ref) => {
    return (
      <Typography
        {...props}
        ref={ref}
        variant="h1"
      >
        {children}
      </Typography>
    );
  }
);

export const H2 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, ...props }, ref) => {
    return (
      <Typography
        {...props}
        ref={ref}
        variant="h2"
      >
        {children}
      </Typography>
    );
  }
);

export const H3 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, ...props }, ref) => {
    return (
      <Typography
        {...props}
        ref={ref}
        variant="h3"
      >
        {children}
      </Typography>
    );
  }
);

export const H4 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, ...props }, ref) => {
    return (
      <Typography
        {...props}
        ref={ref}
        variant="h4"
      >
        {children}
      </Typography>
    );
  }
);

export const H5 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, ...props }, ref) => {
    return (
      <Typography
        {...props}
        ref={ref}
        variant="h5"
      >
        {children}
      </Typography>
    );
  }
);

export const H6 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, ...props }, ref) => {
    return (
      <Typography
        {...props}
        ref={ref}
        variant="h6"
      >
        {children}
      </Typography>
    );
  }
);

export type ParagraphProps = HTMLAttributes<HTMLParagraphElement> & {
  component?: React.ElementType;
  gutterBottom?: boolean;
};

export const Paragraph = forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ children, gutterBottom = true, ...props }, ref) => {
    return (
      <Typography
        {...props}
        ref={ref}
        variant="body1"
        gutterBottom={gutterBottom}
      >
        {children}
      </Typography>
    );
  }
);

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  component?: React.ElementType;
  underline?: LinkTypeMap['props']['underline'];
  color?: LinkTypeMap['props']['color'];
  variant?: LinkTypeMap['props']['variant'];
  sx?: LinkTypeMap['props']['sx'];
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, underline, color, variant, sx, ...props }, ref) => {
    return (
      <MuiLink
        {...props}
        ref={ref}
        color={color}
        underline={underline}
        variant={variant}
        sx={sx}
      >
        {children}
      </MuiLink>
    );
  }
);
