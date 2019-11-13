import React from 'react'

import {
  BlockProps,
  TypograpyTextArea,
  Layer,
  LayerContainer,
  OptionButtonSmall
} from '@karma.run/ui'

import {MaterialIconSyncAlt} from '@karma.run/icons'

export interface TitleBlockValue {
  readonly title: string
  readonly lead: string
}

export interface TitleBlockProps extends BlockProps<TitleBlockValue> {}

export function TitleBlock({}: TitleBlockProps) {
  return (
    <>
      <LayerContainer>
        {/* TODO: Allow layer position, don't fill by default */}
        <Layer style={{right: 0, top: 0, left: 'unset', height: 'auto', width: 'auto'}}>
          <OptionButtonSmall
            icon={MaterialIconSyncAlt}
            title="Use as Meta Title &amp; Lead"
            onClick={() => {}}
          />
        </Layer>
        <TypograpyTextArea variant="title" align="center" placeholder="Title" />
        <TypograpyTextArea variant="body2" align="center" placeholder="Lead Text" />
      </LayerContainer>
    </>
  )
}
