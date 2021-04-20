import React from 'react'
import {BlockList, useBlockMap} from './atoms/blockList'
import {BlockMap} from './blocks/blockMap'
import {BlockValue} from './blocks/types'

export const getContentView = (content: any, handleChange: any, disabled: boolean) => {
  return (
    <BlockList value={content} onChange={handleChange} disabled={disabled}>
      {useBlockMap<BlockValue>(() => BlockMap, [])}
    </BlockList>
  )
}
