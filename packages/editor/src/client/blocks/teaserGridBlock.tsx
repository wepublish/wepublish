import React, {useState, ReactNode} from 'react'
import nanoid from 'nanoid'

import {PlaceholderInput} from '../atoms/placeholderInput'
import {PlaceholderImage} from '../atoms/placeholderImage'
import {BlockProps} from '../atoms/blockList'
import {Overlay} from '../atoms/overlay'
import {Typography} from '../atoms/typography'

import {IconButton, Drawer, Panel, Avatar} from 'rsuite'

import {SortableElement, SortableContainer, SortEnd} from 'react-sortable-hoc'
import arrayMove from 'array-move'

import {TeaserGridBlockValue, Teaser, TeaserType} from './types'

import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'
import {TeaserEditPanel} from '../panel/teaserEditPanel'
import {ImageRefFragment, TeaserStyle, PeerWithProfileFragment} from '../api'

import {useTranslation} from 'react-i18next'
import PencilIcon from '@rsuite/icons/legacy/Pencil'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import FileIcon from '@rsuite/icons/legacy/File'

const GridItem = SortableElement((props: TeaserBlockProps) => {
  return <TeaserBlock {...props} />
})

interface GridProps {
  numColumns: number
  children?: ReactNode
}

const Grid = SortableContainer(({children, numColumns}: GridProps) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
        gridGap: 20,
        userSelect: 'none'
      }}>
      {children}
    </div>
  )
})

export function TeaserGridBlock({value, onChange}: BlockProps<TeaserGridBlockValue>) {
  const [editIndex, setEditIndex] = useState(0)

  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)

  const {teasers, numColumns} = value

  function handleTeaserLinkChange(index: number, teaserLink: Teaser | null) {
    onChange({
      numColumns,
      teasers: Object.assign([], teasers, {
        [index]: [nanoid(), teaserLink || null]
      })
    })
  }

  function handleSortStart() {
    document.documentElement.style.cursor = 'grabbing'
    document.body.style.pointerEvents = 'none'
  }

  function handleSortEnd({oldIndex, newIndex}: SortEnd) {
    document.documentElement.style.cursor = ''
    document.body.style.pointerEvents = ''

    onChange({
      numColumns,
      teasers: arrayMove(teasers, oldIndex, newIndex)
    })
  }

  return (
    <>
      <Grid
        numColumns={numColumns}
        axis="xy"
        distance={10}
        onSortStart={handleSortStart}
        onSortEnd={handleSortEnd}>
        {teasers.map(([key, teaser], index) => (
          <GridItem
            key={key}
            index={index}
            teaser={teaser}
            numColumns={numColumns}
            showGrabCursor={teasers.length !== 1}
            disabled={teasers.length === 1}
            onEdit={() => {
              setEditIndex(index)
              setEditModalOpen(true)
            }}
            onChoose={() => {
              setEditIndex(index)
              setChooseModalOpen(true)
            }}
            onRemove={() => {
              handleTeaserLinkChange(index, null)
            }}
          />
        ))}
      </Grid>
      <Drawer open={isEditModalOpen} size={'sm'} onClose={() => setEditModalOpen(false)}>
        <TeaserEditPanel
          initialTeaser={teasers[editIndex][1]!}
          onClose={() => setEditModalOpen(false)}
          onConfirm={teaser => {
            setEditModalOpen(false)
            handleTeaserLinkChange(editIndex, teaser)
          }}
        />
      </Drawer>
      <Drawer open={isChooseModalOpen} size={'sm'} onClose={() => setChooseModalOpen(false)}>
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

export interface TeaserBlockProps {
  teaser: Teaser | null
  showGrabCursor: boolean
  numColumns: number
  onEdit: () => void
  onChoose: () => void
  onRemove: () => void
}

export function TeaserBlock({
  teaser,
  numColumns,
  showGrabCursor,
  onEdit,
  onChoose,
  onRemove
}: TeaserBlockProps) {
  return (
    <Panel
      bodyFill
      style={{
        cursor: showGrabCursor ? 'grab' : '',
        height: 300,
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
            {contentForTeaser(teaser, numColumns)}

            <div
              style={{
                position: 'absolute',
                zIndex: 1,
                right: 0,
                top: 0
              }}>
              <IconButton
                icon={<FileIcon />}
                onClick={onChoose}
                style={{
                  margin: 10
                }}
              />
              {teaser.type !== TeaserType.PeerArticle || !teaser?.peer?.isDisabled ? (
                <IconButton
                  icon={<PencilIcon />}
                  onClick={onEdit}
                  style={{
                    margin: 10
                  }}
                />
              ) : null}
              <IconButton
                icon={<TrashIcon />}
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

export function contentForTeaser(teaser: Teaser, numColumns?: number) {
  const {t} = useTranslation()
  switch (teaser.type) {
    case TeaserType.Article: {
      const states = []

      if (teaser?.article?.draft) states.push(t('articleEditor.panels.stateDraft'))
      if (teaser?.article?.pending) states.push(t('articleEditor.panels.statePending'))
      if (teaser?.article?.published) states.push(t('articleEditor.panels.statePublished'))

      return (
        <TeaserContent
          style={teaser.style}
          image={teaser.image ?? teaser.article.latest.image ?? undefined}
          preTitle={teaser.preTitle ?? teaser.article.latest.preTitle ?? undefined}
          title={teaser.title ?? teaser.article.latest.title}
          lead={teaser.lead ?? teaser.article.latest.lead ?? undefined}
          states={states}
          numColumns={numColumns}
        />
      )
    }

    case TeaserType.PeerArticle: {
      const states = []

      if (teaser?.article?.draft) states.push(t('articleEditor.panels.stateDraft'))
      if (teaser?.article?.pending) states.push(t('articleEditor.panels.statePending'))
      if (teaser?.article?.published) states.push(t('articleEditor.panels.statePublished'))

      return (
        <TeaserContent
          style={teaser.style}
          image={teaser.image ?? teaser.article?.latest.image ?? undefined}
          preTitle={teaser.preTitle ?? teaser.article?.latest.preTitle ?? undefined}
          title={teaser.title ?? teaser.article?.latest.title}
          lead={teaser.lead ?? teaser.article?.latest.lead ?? undefined}
          states={states}
          peer={teaser.peer}
          numColumns={numColumns}
        />
      )
    }

    case TeaserType.Page: {
      const states = []

      if (teaser?.page?.draft) states.push(t('articleEditor.panels.stateDraft'))
      if (teaser?.page?.pending) states.push(t('articleEditor.panels.statePending'))
      if (teaser?.page?.published) states.push(t('articleEditor.panels.statePublished'))

      return (
        <TeaserContent
          style={teaser.style}
          image={teaser.image ?? teaser.page.latest.image ?? undefined}
          title={teaser.title ?? teaser.page.latest.title}
          lead={teaser.lead ?? teaser.page.latest.description ?? undefined}
          states={states}
          numColumns={numColumns}
        />
      )
    }

    default:
      return null
  }
}

export interface TeaserContentProps {
  style: TeaserStyle
  preTitle?: string
  title?: string
  lead?: string
  image?: ImageRefFragment
  states?: string[]
  peer?: PeerWithProfileFragment
  numColumns?: number
}

function labelForTeaserStyle(style: TeaserStyle) {
  switch (style) {
    case TeaserStyle.Default:
      return 'Default'

    case TeaserStyle.Light:
      return 'Light'

    case TeaserStyle.Text:
      return 'Text'
  }
}

export function TeaserContent({
  style,
  preTitle,
  title,
  lead,
  image,
  states,
  peer,
  numColumns
}: TeaserContentProps) {
  const label = labelForTeaserStyle(style)
  const {t} = useTranslation()
  const stateJoin = states?.join(' / ')
  return (
    <>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%'
        }}>
        {image ? (
          <img
            style={{
              width: '100%',
              height: '100%'
            }}
            src={numColumns === 1 ? image.column1URL ?? '' : image.column6URL ?? ''}
          />
        ) : (
          <PlaceholderImage />
        )}
      </div>

      <Overlay
        style={{
          bottom: '0px',
          width: '100%',
          height: peer && peer.isDisabled === true ? '100%' : 'auto',
          padding: '10px'
        }}>
        {peer && peer.isDisabled === true ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <Typography variant="body2" color="white" spacing="small" align="center">
              {t('articleEditor.panels.peerDisabled')}
            </Typography>
          </div>
        ) : (
          <>
            {' '}
            <div
              style={{
                marginBottom: 10
              }}>
              {preTitle && (
                <Typography variant="subtitle1" color="white" spacing="small" ellipsize>
                  {preTitle}
                </Typography>
              )}
              <Typography variant="body2" color="white" spacing="small">
                {title || t('articleEditor.panels.untitled')}
              </Typography>
              {lead && (
                <Typography variant="subtitle1" color="white" ellipsize>
                  {lead}
                </Typography>
              )}
            </div>
            {peer && (
              <div
                style={{
                  display: 'flex',
                  marginBottom: 10
                }}>
                <Avatar src={peer.profile?.logo?.squareURL ?? undefined} circle />
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap'
              }}>
              <div
                style={{
                  flexShrink: 0,
                  marginRight: 10
                }}>
                <Typography variant="subtitle1" color="gray">
                  {t('articleEditor.panels.teaserStyle', {label})}
                </Typography>
              </div>
              <div style={{flexShrink: 0}}>
                <Typography variant="subtitle1" color="gray">
                  {t('articleEditor.panels.status', {stateJoin})}
                </Typography>
              </div>
            </div>
          </>
        )}
      </Overlay>
    </>
  )
}
