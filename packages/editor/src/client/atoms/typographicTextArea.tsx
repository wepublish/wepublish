import React, {
  useEffect,
  useRef,
  TextareaHTMLAttributes,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
  ChangeEvent
} from 'react'

import {TypographyVariant, stylesForTypographyVariant, TypographyTextAlign} from './typography'

const AutoSizeBuffer = 2

export interface TypographicTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly variant?: TypographyVariant
  readonly align?: TypographyTextAlign
}

export const TypographicTextArea = forwardRef<HTMLTextAreaElement, TypographicTextAreaProps>(
  ({variant = 'body1', align = 'left', onChange, ...props}, forwardRef) => {
    const ref = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(forwardRef, () => ref.current!, [ref.current])

    useLayoutEffect(() => {
      handleResize()
    }, [])

    useEffect(() => {
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
          handleResize()
        })
        if (!ref.current) return
        observer.observe(ref.current)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return () => observer.unobserve(ref.current)
      } else {
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
      }
    }, [ref])

    function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
      handleResize()
      onChange?.(e)
    }

    function handleResize() {
      ref.current!.style.overflow = 'hidden'
      ref.current!.style.height = 'auto'
      ref.current!.style.height = `${ref.current!.scrollHeight + AutoSizeBuffer}px`
    }

    return (
      <textarea
        ref={ref}
        {...props}
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

          outline: 'none !important'

          /* ':focus': {
            outline: 'none'
          }, */

          /* '::placeholder': {
            color: 'gray'
          } */
        }}
        onChange={handleChange}
        rows={1}
      />
    )
  }
)
