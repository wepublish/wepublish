import React from 'react'
import GridLayout from 'react-grid-layout'

import './teaserFlexGrid.less'

export function TeaserFlexGridBlock() {
  const layout = [
    {i: 'a', x: 0, y: 0, w: 1, h: 2, static: true},
    {i: 'b', x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4},
    {i: 'c', x: 4, y: 0, w: 1, h: 2}
  ]
  return (
    <GridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200}>
      {['red', 'blue', 'green'].map(x => (
        <div key={x} style={{backgroundColor: x}}>
          {x}
        </div>
      ))}
    </GridLayout>
  )
}
