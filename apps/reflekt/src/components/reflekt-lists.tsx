import { capitalize, Typography } from '@mui/material';
import { ListItemProps, UnorderedListProps } from '@wepublish/ui';
import { ForwardedRef, forwardRef } from 'react';

// eslint-disable-next-line react/display-name
export const ReflektUnorderedList = forwardRef(
  (
    {
      children,
      gutterBottom = true,
      variant,
      ...props
    }: UnorderedListProps & { variant?: string },
    ref: ForwardedRef<HTMLUListElement>
  ) => {
    return (
      <Typography
        {...props}
        ref={ref}
        component="ul"
        variant={variant ? `ul${capitalize(variant)}` : 'body1'}
        gutterBottom={gutterBottom}
      >
        {children}
      </Typography>
    );
  }
);

// eslint-disable-next-line react/display-name
export const ReflektListItem = forwardRef(
  (
    {
      children,
      gutterBottom = true,
      variant,
      ...props
    }: ListItemProps & { variant?: string },
    ref: ForwardedRef<HTMLLIElement>
  ) => {
    return (
      <Typography
        {...props}
        ref={ref}
        component="li"
        variant={variant ? `li${capitalize(variant)}` : 'body1'}
        gutterBottom={gutterBottom}
      >
        {children}
      </Typography>
    );
  }
);
