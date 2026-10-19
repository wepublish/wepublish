import styled from '@emotion/styled';
import {
  ChangeEvent,
  ComponentPropsWithRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

import {
  stylesForTypographyVariant,
  TypographyTextAlign,
  TypographyVariant,
} from './typography';

const AutoSizeBuffer = 2;

const StyledTextArea = styled('textarea', {
  shouldForwardProp: prop => prop !== 'variant' && prop !== 'align',
})<{
  variant: TypographyVariant;
  align: TypographyTextAlign;
}>`
  display: block;
  width: 100%;
  resize: none;
  border: none;
  font-family: inherit;
  line-height: 1.375;
  color: ${({ theme }) => theme.vars.palette.text.primary};
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
  caret-color: ${({ theme }) => theme.vars.palette.text.primary};
  text-align: ${({ align }) => align};
  outline: none !important;

  ${({ variant }) => ({ ...stylesForTypographyVariant(variant) })}

  &::placeholder {
    color: ${({ theme }) => theme.vars.palette.text.disabled};
  }

  &:disabled {
    color: ${({ theme }) => theme.vars.palette.text.disabled};
    -webkit-text-fill-color: ${({ theme }) => theme.vars.palette.text.disabled};
  }
`;

export interface TypographicTextAreaProps
  extends ComponentPropsWithRef<'textarea'> {
  variant?: TypographyVariant;
  align?: TypographyTextAlign;
}

export const TypographicTextArea = forwardRef<
  HTMLTextAreaElement,
  TypographicTextAreaProps
>(({ variant = 'body1', align = 'left', onChange, ...props }, forwardRef) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(forwardRef, () => ref.current!, []);

  useLayoutEffect(() => {
    handleResize();
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        handleResize();
      });

      if (!ref.current) {
        return;
      }

      observer.observe(ref.current);
      return () => (ref?.current ? observer.unobserve(ref.current) : undefined);
    }

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [ref]);

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    handleResize();
    onChange?.(e);
  }

  function handleResize() {
    if (ref?.current) {
      ref.current.style.overflow = 'hidden';
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight + AutoSizeBuffer}px`;
    }
  }

  return (
    <StyledTextArea
      ref={ref}
      variant={variant}
      align={align}
      onChange={handleChange}
      rows={1}
      {...props}
    />
  );
});
