import React, {useRef, useEffect} from 'react'

import {BlockProps, TypographicTextArea, Box, Checkbox} from '@karma.run/ui'
import {CalloutBreakBlockValue} from './types'

export interface CalloutBreakBlockProps extends BlockProps<CalloutBreakBlockValue> {}

export function CalloutBreakBlock({value, onChange, autofocus, disabled}: CalloutBreakBlockProps) {
  const {text, linkText, linkURL, linkExternal, bgImage, bgStyle, bgColor} = value
  const focusRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autofocus) focusRef.current?.focus()
  }, [])

  return (
    <>
      <Box flexGrow={1}>
        <TypographicTextArea
          ref={focusRef}
          variant="h2"
          placeholder="Text"
          align="center"
          value={text}
          disabled={disabled}
          onChange={e => onChange({...value, text: e.target.value})}
        />
      </Box>
      <TypographicTextArea
        ref={focusRef}
        variant="body1"
        placeholder="Link Text"
        align="center"
        value={linkText}
        disabled={disabled}
        onChange={e => onChange({...value, linkText: e.target.value})}
      />
      <Checkbox
        label={'Open in new tab'}
        checked={linkExternal}
        disabled={disabled}
        onChange={e => onChange({...value, linkExternal: e.target.checked})}
      />
      {bgImage}
      {bgColor}
      {bgStyle}
      <TypographicTextArea
        ref={focusRef}
        variant="body1"
        placeholder="Link Text"
        align="center"
        value={bgColor}
        disabled={disabled}
        onChange={e => onChange({...value, bgColor: e.target.value})}
      />
      <TypographicTextArea
        ref={focusRef}
        variant="subtitle2"
        placeholder="Link URL"
        align="center"
        value={linkURL}
        disabled={disabled}
        onChange={e => onChange({...value, linkURL: e.target.value})}
      />
    </>
  )
}
