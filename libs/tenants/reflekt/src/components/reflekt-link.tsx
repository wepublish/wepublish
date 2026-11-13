import { BuilderLinkProps } from '@wepublish/website/builder';
import { ComponentType, forwardRef, MouseEvent, RefAttributes } from 'react';

import {
  PRESS_DURATION_MS,
  usePressAnimation,
} from './hooks/use-press-animation';

const pressVariants = new Set(['buttonLinkMain', 'buttonLinkSecondary']);

type LinkProps = BuilderLinkProps & { variant?: string };

type BaseLinkComponent = ComponentType<
  LinkProps & RefAttributes<HTMLAnchorElement>
>;

export const withPressAnimation = (BaseLink: BaseLinkComponent) => {
  const PressLink = forwardRef<HTMLAnchorElement, LinkProps>(
    function ReflektPressLink(
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
        <BaseLink
          {...props}
          ref={ref}
          href={href}
          variant={variant}
          className={finalClassName}
          onClick={handleClick}
        >
          {children}
        </BaseLink>
      );
    }
  );

  return forwardRef<HTMLAnchorElement, LinkProps>(function ReflektLink(
    { variant, ...props },
    ref
  ) {
    if (!variant || !pressVariants.has(variant)) {
      return (
        <BaseLink
          {...props}
          ref={ref}
          variant={variant}
        />
      );
    }

    return (
      <PressLink
        {...props}
        ref={ref}
        variant={variant}
      />
    );
  });
};
