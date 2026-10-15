import { Typography } from '@mui/material';
import { ElementType, ForwardedRef, HTMLAttributes, forwardRef } from 'react';

export type UnorderedListProps = HTMLAttributes<HTMLUListElement> & {
  component?: ElementType;
  gutterBottom?: boolean;
};

export const UnorderedList = forwardRef(
  (
    { children, gutterBottom = true, ...props }: UnorderedListProps,
    ref: ForwardedRef<HTMLUListElement>
  ) => {
    return (
      <Typography
        {...props}
        ref={ref}
        component="ul"
        variant="body1"
        gutterBottom={gutterBottom}
      >
        {children}
      </Typography>
    );
  }
);

export type OrderedListProps = HTMLAttributes<HTMLOListElement> & {
  component?: ElementType;
  gutterBottom?: boolean;
};

export const OrderedList = forwardRef(
  (
    { children, gutterBottom = true, ...props }: OrderedListProps,
    ref: ForwardedRef<HTMLOListElement>
  ) => {
    return (
      <Typography
        {...props}
        ref={ref}
        component="ol"
        variant="body1"
        gutterBottom={gutterBottom}
      >
        {children}
      </Typography>
    );
  }
);

export type ListItemProps = HTMLAttributes<HTMLLIElement> & {
  component?: ElementType;
  gutterBottom?: boolean;
};

export const ListItem = forwardRef(
  (
    { children, gutterBottom = true, ...props }: ListItemProps,
    ref: ForwardedRef<HTMLLIElement>
  ) => {
    return (
      <Typography
        {...props}
        ref={ref}
        component="li"
        variant="body1"
        gutterBottom={gutterBottom}
      >
        {children}
      </Typography>
    );
  }
);
