import { forwardRef } from 'react';
import { BuilderLinkProps } from './typography.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Link = forwardRef<HTMLAnchorElement, BuilderLinkProps>(
  (props, ref) => {
    const {
      elements: { Link },
    } = useWebsiteBuilder();

    return (
      <Link
        {...props}
        ref={ref}
      />
    );
  }
);
