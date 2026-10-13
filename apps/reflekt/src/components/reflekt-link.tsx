import { NextWepublishLink } from '@wepublish/utils/website';
import { BuilderLinkProps } from '@wepublish/website/builder';
import { forwardRef, MouseEvent } from 'react';

import {
  PRESS_DURATION_MS,
  usePressAnimation,
} from './hooks/use-press-animation';

const pressVariants = new Set(['buttonLinkMain', 'buttonLinkSecondary']);

export const ReflektLink = forwardRef<
  HTMLAnchorElement,
  BuilderLinkProps & { variant?: string }
>(function ReflektLink({ variant, ...props }, ref) {
  if (!variant || !pressVariants.has(variant)) {
    return (
      <NextWepublishLink
        {...props}
        ref={ref}
        variant={variant}
      />
    );
  }
  return (
    <ReflektPressLink
      {...props}
      ref={ref}
      variant={variant}
    />
  );
});

const ReflektPressLink = forwardRef<
  HTMLAnchorElement,
  BuilderLinkProps & { variant?: string }
>(function ReflektPressLink(
  { children, href, variant, className, onClick: onClickProp, ...props },
  ref
) {
  const { isPressing, onClick } = usePressAnimation(
    typeof href === 'string' ? href : undefined
  );

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick(event);
    if (onClickProp) {
      window.setTimeout(() => onClickProp(event), PRESS_DURATION_MS);
    }
  };

  const finalClassName =
    isPressing ?
      [className, 'is-pressing'].filter(Boolean).join(' ')
    : className;

  return (
    <NextWepublishLink
      {...props}
      ref={ref}
      href={href}
      variant={variant}
      className={finalClassName}
      onClick={handleClick}
    >
      {children}
    </NextWepublishLink>
  );
});
