import React, {useEffect, useState} from 'react'
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
  FlexItemAlignment,
  FlexTeaser,
  Teaser,
  TeaserFlexGridBlockValue
  // Teaser,
  // TeaserType,
  // FlexTeaserPlacement,
  // FlexGridItemLayout
} from './types'
import {BlockProps} from '../atoms/blockList'
import nanoid from 'nanoid'
import {ButtonToolbar, Drawer, Icon, IconButton, Panel} from 'rsuite'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {contentForTeaser, TeaserBlockProps} from './teaserGridBlock'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {TeaserEditPanel} from '../panel/teaserEditPanel'
import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'

// import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'
// import {TeaserEditPanel} from '../panel/teaserEditPanel'
// import {ImageRefFragment, TeaserStyle, PeerWithProfileFragment} from '../api'

// import {useTranslation} from 'react-i18next'

export function FlexTeaserBlock({
  teaser,
  showGrabCursor,
  onEdit,
  onChoose,
  onRemove
}: TeaserBlockProps) {
  return (
    <Panel
      bodyFill={true}
      style={{
        cursor: showGrabCursor ? 'grab' : '',
        height: 'inherit',
        overflow: 'hidden',
        zIndex: 1
      }}>
      <PlaceholderInput onAddClick={onChoose}>
        {teaser && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%'
            }}>
            {contentForTeaser(teaser)}

            <div
              style={{
                position: 'absolute',
                zIndex: 1,
                right: 0,
                top: 0
              }}>
              <IconButton
                icon={<Icon icon="file" />}
                onClick={onChoose}
                style={{
                  margin: 10
                }}
              />
              <IconButton
                icon={<Icon icon="pencil" />}
                onClick={onEdit}
                style={{
                  margin: 10
                }}
              />
              <IconButton
                icon={<Icon icon="trash" />}
                onClick={onRemove}
                style={{
                  margin: 10
                }}
              />
            </div>
          </div>
        )}
      </PlaceholderInput>
    </Panel>
  )
}

export function TeaserFlexGridBlock({value, onChange}: BlockProps<TeaserFlexGridBlockValue>) {
  const [editIndex, setEditIndex] = useState('')

  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)

  const [flexTeasers, setFlexTeasers] = useState(value.flexTeasers)

  useEffect(() => {
    onChange({
      ...value,
      flexTeasers: flexTeasers
    })
  }, [flexTeasers])

  // Teaser Block functions: add, remove, layout change, sort, pin
  const handleAddTeaser = () => {
    const newTeaser: FlexTeaser = {
      alignment: {
        i: nanoid(),
        x: 0,
        y: 0,
        w: 4,
        h: 4
      },
      teaser: null
    }
    setFlexTeasers(flexTeasers => [...flexTeasers, newTeaser])
  }

  const handleRemoveTeaser = (index: string) => {
    setFlexTeasers(flexTeasers.filter(flexTeaser => flexTeaser.alignment.i !== index))
  }

  // TODO: set grab pointer
  /*
  function handleSortStart() {
    document.documentElement.style.cursor = 'grabbing'
    document.body.style.pointerEvents = 'none'
  }

  function handleSortEnd() {
    document.documentElement.style.cursor = ''
    document.body.style.pointerEvents = ''
  }
*/
  const handleLayoutChange = (alignment: FlexItemAlignment[]) => {
    const newFlexTeasers = alignment.map(v => {
      return {
        teaser: flexTeasers.find(flexTeaser => v.i === flexTeaser.alignment.i)?.teaser ?? null,
        alignment: v
      }
    })

    setFlexTeasers(newFlexTeasers)
  }

  // TODO not working properly
  const handlePinTeaser = (index: string) => {
    const newTeasers = flexTeasers.map(flexTeaser => {
      return flexTeaser.alignment.i !== index
        ? flexTeaser
        : {
            teaser: flexTeaser.teaser,
            alignment: {
              i: flexTeaser.alignment.i,
              x: flexTeaser.alignment.x,
              y: flexTeaser.alignment.y,
              w: flexTeaser.alignment.w,
              h: flexTeaser.alignment.h,
              static: !flexTeaser.alignment.static
            }
          }
    })
    setFlexTeasers(newTeasers)
  }

  // Teaser functions: change,
  function handleTeaserLinkChange(index: string, teaserLink: Teaser | null) {
    setFlexTeasers(
      flexTeasers.map(flexTeaser => {
        return flexTeaser.alignment.i === index
          ? {alignment: flexTeaser.alignment, teaser: teaserLink}
          : flexTeaser
      })
    )
  }
  return (
    <>
      <IconButtonTooltip caption="add">
        <IconButton icon={<Icon icon="plus" />} circle size="sm" onClick={handleAddTeaser} />
      </IconButtonTooltip>
      <GridLayout
        className="layout"
        // onDragStart={handleSortStart}
        // onDragStop={handleSortEnd}
        onLayoutChange={layout => handleLayoutChange(layout)}
        cols={12}
        rowHeight={30}
        width={1200}>
        {flexTeasers.map(flexTeaser => (
          <div
            data-grid={{
              x: flexTeaser.alignment.x,
              y: flexTeaser.alignment.y,
              w: flexTeaser.alignment.w,
              h: flexTeaser.alignment.h,
              static: flexTeaser.alignment.static
            }}
            key={flexTeaser.alignment.i}>
            <FlexTeaserBlock
              teaser={flexTeaser.teaser}
              showGrabCursor={true}
              onEdit={() => {
                setEditIndex(flexTeaser.alignment.i)
                setEditModalOpen(true)
              }}
              onChoose={() => {
                setEditIndex(flexTeaser.alignment.i)
                setChooseModalOpen(true)
              }}
              onRemove={() => console.log('remove')}
            />
            <ButtonToolbar style={{top: 0, position: 'absolute'}}>
              <IconButton
                block
                appearance="subtle"
                icon={<Icon icon="trash" />}
                onClick={() => handleRemoveTeaser(flexTeaser.alignment.i)}
              />
              <IconButton
                block
                appearance="subtle"
                icon={
                  <Icon
                    style={{color: flexTeaser.alignment.static ? 'red' : undefined}}
                    icon="thumb-tack"
                  />
                }
                onClick={() => handlePinTeaser(flexTeaser.alignment.i)}
              />
            </ButtonToolbar>
          </div>
        ))}
      </GridLayout>

      <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
        <TeaserEditPanel
          // TODO change teaser
          initialTeaser={flexTeasers[0].teaser!}
          onClose={() => setEditModalOpen(false)}
          onConfirm={teaser => {
            setEditModalOpen(false)
            handleTeaserLinkChange(editIndex, teaser)
          }}
        />
      </Drawer>
      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <TeaserSelectAndEditPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={teaser => {
            setChooseModalOpen(false)
            handleTeaserLinkChange(editIndex, teaser)
          }}
        />
      </Drawer>
    </>
  )
}

/*
}
export interface TeaserContentProps {
  style: TeaserStyle
  preTitle?: string
  title?: string
  lead?: string
  image?: ImageRefFragment
  states?: string[]
  peer?: PeerWithProfileFragment
  layout: FlexTeaserSize[]
}
export interface FlexTeaserSize {
  i: string
  x: number
  y: number
  w: number
  h: number
}

*/
