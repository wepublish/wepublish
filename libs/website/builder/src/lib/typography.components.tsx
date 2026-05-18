import { forwardRef } from 'react';
import { BuilderLinkProps } from './typography.interface';
import { useWebsiteBuilder } from './website-builder.context';
import { mergeDeepRight } from 'ramda';
import { createContext, useContext, useMemo } from 'react';

export const LinkContext = createContext<Pick<BuilderLinkProps, 'prefetch'>>(
  {}
);

export const useLinkProps = (props: BuilderLinkProps): BuilderLinkProps => {
  const contextProps = useContext(LinkContext);

  return useMemo(
    () =>
      mergeDeepRight(
        {
          prefetch: false,
          ...props,
        },
        contextProps
      ),
    [contextProps, props]
  );
};

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
