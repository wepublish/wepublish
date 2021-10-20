import React from 'react'
import GridLayout from 'react-grid-layout'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// import nanoid from 'nanoid'

// import {PlaceholderInput} from '../atoms/placeholderInput'
// import {PlaceholderImage} from '../atoms/placeholderImage'
// import {BlockProps} from '../atoms/blockList'
// import {Overlay} from '../atoms/overlay'
// import {Typography} from '../atoms/typography'

// import {IconButton, Drawer, Panel, Icon, Avatar} from 'rsuite'

// import {SortableElement, SortableContainer, SortEnd} from 'react-sortable-hoc'
// import arrayMove from 'array-move'

import {
  TeaserFlexGridBlockValue
  // Teaser,
  // TeaserType,
  // FlexTeaserPlacement,
  // FlexGridItemLayout
} from './types'
import {BlockProps} from '../atoms/blockList'

// import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'
// import {TeaserEditPanel} from '../panel/teaserEditPanel'
// import {ImageRefFragment, TeaserStyle, PeerWithProfileFragment} from '../api'

// import {useTranslation} from 'react-i18next'

export function TeaserFlexGridBlock({value}: BlockProps<TeaserFlexGridBlockValue>) {
  return (
    <>
      <h1>test</h1>
      <GridLayout
        // onDragStart={handleSortStart}
        // onDragStop={() => handleSortEnd}
        className="layout"
        // layout={layout}
        cols={12}
        rowHeight={30}
        width={1200}>
        {value.flexTeasers.map((teaser, index) => {
          ;<div style={{backgroundColor: 'lightskyblue'}} key={teaser.alignment.i}>
            {teaser.teaser?.title}
          </div>
        })}
      </GridLayout>
    </>
  )
}
