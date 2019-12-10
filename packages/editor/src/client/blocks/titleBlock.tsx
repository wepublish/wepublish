import React, {useRef, useEffect} from 'react'

import {BlockProps, TypographicTextArea, LayerContainer} from '@karma.run/ui'

export interface TitleBlockValue {
  readonly title: string
  readonly lead: string
}

export interface TitleBlockProps extends BlockProps<TitleBlockValue> {}

export function TitleBlock({value, onChange, autofocus, disabled}: TitleBlockProps) {
  const {title, lead} = value
  const focusRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autofocus) focusRef.current?.focus()
  }, [])

  return (
    <>
      <LayerContainer>
        {/* TODO: Meta sync */}
        {/* <Layer right={0} top={0}>
          <IconButton
            icon={MaterialIconSyncAlt}
            title="Use as Meta Title &amp; Lead"
            onClick={() => {}}
          />
        </Layer> */}
        <TypographicTextArea
          ref={focusRef}
          variant="title"
          align="center"
          placeholder="Title"
          value={title}
          disabled={disabled}
          onChange={e => onChange({...value, title: e.target.value})}
        />
        <TypographicTextArea
          variant="body1"
          align="center"
          placeholder="Lead Text"
          value={lead}
          disabled={disabled}
          onChange={e => onChange({...value, lead: e.target.value})}
        />
      </LayerContainer>
    </>
  )
}
