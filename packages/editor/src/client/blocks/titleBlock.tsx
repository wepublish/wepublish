import React from 'react'

import {BlockProps, TypograpyTextArea, Layer, LayerContainer} from '@karma.run/ui'

export interface TitleBlockValue {
  readonly title: string
  readonly lead: string
}

export interface TitleBlockProps extends BlockProps<TitleBlockValue> {}

export function TitleBlock({value, onChange}: TitleBlockProps) {
  const {title, lead} = value

  return (
    <>
      <LayerContainer>
        {/* TODO: Allow layer position, don't fill by default */}
        <Layer style={{right: 0, top: 0, left: 'unset', height: 'auto', width: 'auto'}}>
          {/* TODO: Meta sync */}
          {/* <OptionButtonSmall
            icon={MaterialIconSyncAlt}
            title="Use as Meta Title &amp; Lead"
            onClick={() => {}}
          /> */}
        </Layer>
        <TypograpyTextArea
          variant="title"
          align="center"
          placeholder="Title"
          value={title}
          onChange={e => onChange({...value, title: e.target.value})}
        />
        <TypograpyTextArea
          variant="body1"
          align="center"
          placeholder="Lead Text"
          value={lead}
          onChange={e => onChange({...value, lead: e.target.value})}
        />
      </LayerContainer>
    </>
  )
}
