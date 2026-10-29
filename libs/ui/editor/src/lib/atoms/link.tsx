import { Link as MuiLink, LinkProps as MuiLinkProps } from '@mui/material';
import { forwardRef } from 'react';
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from 'react-router-dom';

export type LinkProps = Omit<MuiLinkProps, 'href'> &
  Pick<RouterLinkProps, 'to' | 'replace' | 'state' | 'reloadDocument'>;

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  function Link(props, ref) {
    return (
      <MuiLink
        ref={ref}
        component={RouterLink}
        {...props}
      />
    );
  }
);
