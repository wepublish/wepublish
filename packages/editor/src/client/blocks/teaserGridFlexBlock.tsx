import React, {useEffect, useState} from 'react'
import GridLayout from 'react-grid-layout'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import {FlexAlignment, FlexTeaser, Teaser, TeaserGridFlexBlockValue} from './types'
import {BlockProps} from '../atoms/blockList'
import nanoid from 'nanoid'
import {ButtonToolbar, Drawer, IconButton, Panel} from 'rsuite'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {contentForTeaser} from './teaserGridBlock'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {TeaserEditPanel} from '../panel/teaserEditPanel'
import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'

import {useTranslation} from 'react-i18next'
import i18next from 'i18next'
import PencilIcon from '@rsuite/icons/legacy/Pencil'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import FileIcon from '@rsuite/icons/legacy/File'
import PlusSquareOIcon from '@rsuite/icons/legacy/PlusSquareO'
import LockIcon from '@rsuite/icons/legacy/Lock'
import UnlockIcon from '@rsuite/icons/legacy/Unlock'

export function FlexTeaserBlock({
  teaser,
  showGrabCursor,
  onEdit,
  onChoose,
  onRemove
}: FlexTeaserBlockProps) {
  return (
    <Panel
      bodyFill
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
              <IconButtonTooltip caption={i18next.t('blocks.flexTeaser.chooseTeaser')}>
                <IconButton
                  icon={<FileIcon />}
                  onClick={onChoose}
                  style={{
                    margin: 10
                  }}
                />
              </IconButtonTooltip>
              <IconButtonTooltip caption={i18next.t('blocks.flexTeaser.editTeaser')}>
                <IconButton
                  icon={<PencilIcon />}
                  onClick={onEdit}
                  style={{
                    margin: 10
                  }}
                />
              </IconButtonTooltip>
              <IconButtonTooltip caption={i18next.t('blocks.flexTeaser.deleteTeaser')}>
                <IconButton
                  icon={<TrashIcon />}
                  onClick={onRemove}
                  style={{
                    margin: 10
                  }}
                />
              </IconButtonTooltip>
            </div>
          </div>
        )}
      </PlaceholderInput>
    </Panel>
  )
}

export function TeaserGridFlexBlock({value, onChange}: BlockProps<TeaserGridFlexBlockValue>) {
  const [editItem, setEditItem] = useState<FlexTeaser>()

  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const {flexTeasers} = value

  const {t} = useTranslation()

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
        h: 4,
        static: false
      },
      teaser: null
    }
    onChange({...value, flexTeasers: [...flexTeasers, newTeaser]})
  }

  const handleRemoveTeaserBlock = (index: string) => {
    onChange({
      ...value,
      flexTeasers: flexTeasers.filter(flexTeaser => flexTeaser.alignment.i !== index)
    })
  }

  const handleLayoutChange = (layout: FlexAlignment[]) => {
    const newFlexTeasers = layout.map(v => {
      return {
        teaser: flexTeasers.find(flexTeaser => v.i === flexTeaser.alignment.i)?.teaser ?? null,
        alignment: v
      }
    })
    onChange({...value, flexTeasers: newFlexTeasers})
  }

  const handlePinTeaserBlock = (index: string) => {
    const newTeasers = flexTeasers.map(({teaser, alignment}) => {
      return alignment.i === index
        ? {
            teaser: teaser,
            alignment: {
              i: alignment.i,
              x: alignment.x,
              y: alignment.y,
              w: alignment.w,
              h: alignment.h,
              static: !alignment.static
            }
          }
        : {teaser: teaser, alignment: alignment}
    })
    onChange({...value, flexTeasers: newTeasers})
  }

  // Teaser functions: change, remove
  function handleTeaserLinkChange(index: string, teaserLink: Teaser | null) {
    onChange({
      ...value,
      flexTeasers: flexTeasers.map(ft => {
        return ft.alignment.i === index ? {alignment: ft.alignment, teaser: teaserLink} : ft
      })
    })
  }

  function handleRemoveTeaser(index: string) {
    onChange({
      ...value,
      flexTeasers: flexTeasers.map(({teaser, alignment}) => {
        return alignment.i === index
          ? {alignment: alignment, teaser: null}
          : {teaser: teaser, alignment: alignment}
      })
    })
  }

  return (
    <>
      <IconButtonTooltip caption={t('blocks.flexTeaser.addBlock')}>
        <IconButton
          icon={<PlusSquareOIcon />}
          appearance="primary"
          circle
          size="md"
          onClick={handleAddTeaserBlock}
        />
      </IconButtonTooltip>
      <GridLayout
        onResizeStop={layout => handleLayoutChange(layout)}
        onDrop={layout => handleLayoutChange(layout)}
        className="layout"
        onDragStop={layout => {
          setIsDragging(false)
          handleLayoutChange(layout)
        }}
        onDrag={() => setIsDragging(true)} // buggy behavior with onDragStart with double click
        cols={12}
        rowHeight={30}
        layout={flexTeasers.map(ft => ft.alignment)}
        width={800}>
        {flexTeasers.map(flexTeaser => (
          <div key={flexTeaser.alignment.i}>
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
                    disabled={flexTeaser.alignment.static}
                    block
                    appearance="subtle"
                    icon={<TrashIcon />}
                    onClick={() => handleRemoveTeaserBlock(flexTeaser.alignment.i)}
                  />
                </IconButtonTooltip>
              )}
              <IconButtonTooltip
                caption={
                  !flexTeaser.alignment.static
                    ? t('blocks.flexTeaser.lockBlock')
                    : t('blocks.flexTeaser.unlockBlock')
                }>
                <IconButton
                  block
                  appearance="subtle"
                  icon={flexTeaser.alignment.static ? <LockIcon /> : <UnlockIcon />}
                  onClick={() => handlePinTeaserBlock(flexTeaser.alignment.i)}
                />
              </IconButtonTooltip>
            </ButtonToolbar>
          </div>
        ))}
      </GridLayout>

      <Drawer open={isEditModalOpen} size={'sm'} onClose={() => setEditModalOpen(false)}>
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
      <Drawer open={isChooseModalOpen} size={'sm'} onClose={() => setChooseModalOpen(false)}>
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

interface FlexTeaserBlockProps {
  teaser: Teaser | null
  showGrabCursor: boolean
  onEdit: () => void
  onChoose: () => void
  onRemove: () => void
}
