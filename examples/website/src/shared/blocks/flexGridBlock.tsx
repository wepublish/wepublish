import React from 'react'
import {FlexTeaser} from '../types'
import {renderBlock, RenderBlockOptions} from './blockRenderer'
import {Color} from '../style/colors'

export interface FlexGridBlockProps {
  flexTeasers: FlexTeaser[]
  opts: RenderBlockOptions
}

export function FlexGridBlock({flexTeasers, opts}: FlexGridBlockProps) {
  let numberOfRows = 1
  const rows = flexTeasers.map(ft => ft.alignment.h + ft.alignment.y)
  numberOfRows = Math.max(...rows) + 1

  return (
    <>
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 7.6vw)',
          gridTemplateRows: `repeat(${numberOfRows}, 7.6vw)`,
          gridAutoFlow: 'column',
          gridGap: '4px'
        }}>
        {flexTeasers.map((flex, index) => {
          return (
            <div
              style={{
                border: `1px solid ${Color.Primary}`,
                gridColumn: `${flex.alignment.x + 1} / span ${flex.alignment.w}`,
                gridRow: `${flex.alignment.y + 1} / span ${flex.alignment.h}`
              }}
              key={index}>
              {flex.blocks[0] ? renderBlock(flex.blocks[0], opts) : null}
            </div>
          )
        })}
      </div>
    </>
  )
}
