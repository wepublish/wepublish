import React, {useRef, useEffect} from 'react'

import {BlockProps, TypographicTextArea, Box, TextInput} from '@karma.run/ui'
import {LinkPageBreakBlockValue} from './types'

export type LinkPageBreakBlockProps = BlockProps<LinkPageBreakBlockValue>

export function LinkPageBreakBlock({
  value,
  onChange,
  autofocus,
  disabled
}: LinkPageBreakBlockProps) {
  const {text, linkText, linkURL, styleOption} = value
  const focusRef = useRef<HTMLTextAreaElement>(null)
  const focusInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autofocus) focusRef.current?.focus()
  }, [])

  return (
    <>
      <Box flexGrow={1}>
        <p style={{margin: '0 auto', textAlign: 'center'}}> I am the label for text</p>
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
      <Box style={{width: '50%', display: 'inline-block'}}>
        <TextInput
          ref={focusInputRef}
          placeholder="Link Text"
          label="Button label"
          value={linkText}
          disabled={disabled}
          onChange={e => onChange({...value, linkText: e.target.value})}
        />
      </Box>
      <Box style={{width: '50%', display: 'inline-block', padding: '10px'}}>
        <TextInput
          ref={focusInputRef}
          placeholder="Link URL"
          label="Button link"
          value={linkURL}
          disabled={disabled}
          onChange={e => onChange({...value, linkURL: e.target.value})}
        />
      </Box>
      <Box style={{width: '50%', display: 'inline-block', padding: '10px'}}>
        <select
          defaultValue={styleOption}
          onChange={e => onChange({...value, styleOption: e.target.value || ''})}>
          <option value="volvo">Volvo</option>
          <option value="saab" selected>
            Saab
          </option>
          <option value="mercedes">Mercedes</option>
          <option value="audi">Audi</option>
        </select>
      </Box>
    </>
  )
}
