import React, {useEffect, useState} from 'react'
import GridLayout from 'react-grid-layout'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import {FlexItemAlignment, FlexTeaser, Teaser, TeaserFlexGridBlockValue} from './types'
import {BlockProps} from '../atoms/blockList'
import nanoid from 'nanoid'
import {ButtonToolbar, Drawer, Icon, IconButton, Panel} from 'rsuite'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {contentForTeaser, TeaserBlockProps} from './teaserGridBlock'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {TeaserEditPanel} from '../panel/teaserEditPanel'
import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'

import {useTranslation} from 'react-i18next'

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
  const [editItem, setEditItem] = useState<FlexTeaser>()

  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [flexTeasers, setFlexTeasers] = useState(value.flexTeasers)

  const {t} = useTranslation()

  useEffect(() => {
    onChange({
      ...value,
      flexTeasers: flexTeasers
    })
  }, [flexTeasers])

  useEffect(() => {
    if (isDragging) {
      document.documentElement.style.cursor = 'grabbing'
      document.body.style.pointerEvents = 'none'
    } else {
      document.documentElement.style.cursor = ''
      document.body.style.pointerEvents = ''
    }
  }, [isDragging])

  // Teaser Block functions: add, remove, layout change, pin
  const handleAddTeaserBlock = () => {
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

  const handleRemoveTeaserBlock = (index: string) => {
    setFlexTeasers(flexTeasers.filter(flexTeaser => flexTeaser.alignment.i !== index))
  }

  const handleLayoutChange = (alignment: FlexItemAlignment[]) => {
    const newFlexTeasers = alignment.map(v => {
      return {
        teaser: flexTeasers.find(flexTeaser => v.i === flexTeaser.alignment.i)?.teaser ?? null,
        alignment: v
      }
    })

    setFlexTeasers(newFlexTeasers)
  }

  const handlePinTeaserBlock = (index: string) => {
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

  // Teaser functions: change, remove
  function handleTeaserLinkChange(index: string, teaserLink: Teaser | null) {
    setFlexTeasers(
      flexTeasers.map(flexTeaser => {
        return flexTeaser.alignment.i === index
          ? {alignment: flexTeaser.alignment, teaser: teaserLink}
          : flexTeaser
      })
    )
  }

  function handleRemoveTeaser(index: string) {
    setFlexTeasers(
      flexTeasers.map(flexTeaser => {
        return flexTeaser.alignment.i === index
          ? {alignment: flexTeaser.alignment, teaser: null}
          : flexTeaser
      })
    )
  }

  return (
    <>
      <IconButtonTooltip caption={t('blocks.flexTeaser.addBlock')}>
        <IconButton icon={<Icon icon="plus" />} circle size="sm" onClick={handleAddTeaserBlock} />
      </IconButtonTooltip>
      <GridLayout
        className="layout"
        onDragStop={() => setIsDragging(false)}
        onDrag={() => setIsDragging(true)} // buggy behavior with onDragStart with double click
        onLayoutChange={layout => handleLayoutChange(layout)}
        cols={12} // TODO make dynamic?
        rowHeight={30} // TODO make dynamic?
        layout={flexTeasers.map(ft => ft.alignment)}
        width={800}>
        {flexTeasers.map(flexTeaser => (
          <div
            data-grid={{
              x: flexTeaser.alignment.x,
              y: flexTeaser.alignment.y,
              w: flexTeaser.alignment.w,
              h: flexTeaser.alignment.h
            }}
            key={flexTeaser.alignment.i}>
            <FlexTeaserBlock
              teaser={flexTeaser.teaser}
              showGrabCursor={!flexTeaser.alignment.static}
              onEdit={() => {
                setEditItem(flexTeaser)
                setEditModalOpen(true)
              }}
              onChoose={() => {
                setEditItem(flexTeaser)
                setChooseModalOpen(true)
              }}
              onRemove={() => handleRemoveTeaser(flexTeaser.alignment.i)}
            />
            <ButtonToolbar style={{top: 1, left: 1, position: 'absolute'}}>
              {!flexTeaser.teaser && (
                <IconButtonTooltip caption={t('blocks.flexTeaser.removeBlock')}>
                  <IconButton
                    block
                    appearance="subtle"
                    icon={<Icon icon="trash" />}
                    onClick={() => handleRemoveTeaserBlock(flexTeaser.alignment.i)}
                  />
                </IconButtonTooltip>
              )}
              <IconButtonTooltip caption={t('blocks.flexTeaser.pinBlock')}>
                <IconButton
                  block
                  appearance="subtle"
                  icon={
                    <Icon
                      style={{color: flexTeaser.alignment.static ? 'red' : undefined}}
                      icon="thumb-tack"
                    />
                  }
                  onClick={() => handlePinTeaserBlock(flexTeaser.alignment.i)}
                />
              </IconButtonTooltip>
            </ButtonToolbar>
          </div>
        ))}
      </GridLayout>

      <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
        {editItem?.teaser && (
          <TeaserEditPanel
            key={editItem.alignment.i}
            initialTeaser={editItem.teaser}
            onClose={() => setEditModalOpen(false)}
            onConfirm={teaser => {
              setEditModalOpen(false)
              handleTeaserLinkChange(editItem.alignment.i, teaser)
            }}
          />
        )}
      </Drawer>
      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <TeaserSelectAndEditPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={teaser => {
            setChooseModalOpen(false)
            if (editItem?.alignment.i) handleTeaserLinkChange(editItem.alignment.i, teaser)
          }}
        />
      </Drawer>
    </>
  )
}
