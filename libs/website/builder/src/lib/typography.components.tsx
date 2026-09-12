import { forwardRef } from 'react';
import {
  BuilderHeadingProps,
  BuilderLinkProps,
  BuilderParagraphProps,
} from './typography.interface';
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

export const H1 = (props: BuilderHeadingProps) => {
  const {
    elements: { H1 },
  } = useWebsiteBuilder();

  return <H1 {...props} />;
};

export const H2 = (props: BuilderHeadingProps) => {
  const {
    elements: { H2 },
  } = useWebsiteBuilder();

  return <H2 {...props} />;
};

export const H3 = (props: BuilderHeadingProps) => {
  const {
    elements: { H3 },
  } = useWebsiteBuilder();

  return <H3 {...props} />;
};

export const H4 = (props: BuilderHeadingProps) => {
  const {
    elements: { H4 },
  } = useWebsiteBuilder();

  return <H4 {...props} />;
};

export const H5 = (props: BuilderHeadingProps) => {
  const {
    elements: { H5 },
  } = useWebsiteBuilder();

  return <H5 {...props} />;
};

export const H6 = (props: BuilderHeadingProps) => {
  const {
    elements: { H6 },
  } = useWebsiteBuilder();

  return <H6 {...props} />;
};

export const Paragraph = (props: BuilderParagraphProps) => {
  const {
    elements: { Paragraph },
  } = useWebsiteBuilder();

  return <Paragraph {...props} />;
};
