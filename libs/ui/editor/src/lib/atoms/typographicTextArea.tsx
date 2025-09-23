import {
  ChangeEvent,
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

export interface TypographicTextAreaProps
  extends React.ComponentPropsWithRef<'textarea'> {
  readonly variant?: TypographyVariant;
  readonly align?: TypographyTextAlign;
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
    <textarea
      ref={ref}
      style={{
        display: 'block',

        width: '100%',
        resize: 'none',

        borderStyle: 'none',
        borderWidth: 0,
        borderColor: 'transparent',

        fontFamily: 'inherit',
        lineHeight: 1.375,

        color: 'black',
        textAlign: align,
        ...stylesForTypographyVariant(variant),

        outline: 'none !important',
      }}
      onChange={handleChange}
      rows={1}
      {...props}
    />
  );
});
