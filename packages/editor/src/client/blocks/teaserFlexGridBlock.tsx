import React, {useState, ReactNode, useEffect} from 'react'
import GridLayout, {Layout} from 'react-grid-layout'

import {PlaceholderInput} from '../atoms/placeholderInput'
import {PlaceholderImage} from '../atoms/placeholderImage'
import {BlockProps} from '../atoms/blockList'
import {Overlay} from '../atoms/overlay'
import {Typography} from '../atoms/typography'

import {IconButton, Drawer, Panel, Icon, Avatar} from 'rsuite'

import './teaserFlexGridBlock.less'
import nanoid from 'nanoid'

import {TeaserFlexGridBlockValue, Teaser, TeaserType} from './types'

import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'
import {TeaserEditPanel} from '../panel/teaserEditPanel'
import {ImageRefFragment, TeaserStyle, PeerWithProfileFragment} from '../api'

import {useTranslation} from 'react-i18next'

export function TeaserFlexGridBlock({value, onChange}: BlockProps<TeaserFlexGridBlockValue>) {
  const [editIndex, setEditIndex] = useState(0)

  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)

  const {teasers, numColumns, numRows} = value

  function handleTeaserLinkChange(index: number, teaserLink: Teaser | null) {
    onChange({
      numRows,
      numColumns,
      teasers: Object.assign([], teasers, {
        [index]: [teasers[index][0], teaserLink || null]
      })
    })
  }

  const handleLayoutChange = (layout: Layout[]) => {
    // TODO when to sort teasers rule (eg. y value?) for passing to API according
    // FIXME / OPTIMIZE? sometime invoked twice, maybe add some debouncing, ie timeout before state update?
    onChange({
      numColumns,
      numRows,
      teasers: teasers.map(([, teaser], i) => [layout[i], teaser])
    })
  }

  const ItemTopBarStyle: React.CSSProperties = {
    position: 'absolute',
    top: '2px',
    cursor: 'pointer'
  }

  return (
    <>
      <p>{JSON.stringify(teasers.map(([l]) => l))}</p>
      <GridLayout
        className="layout"
        cols={numColumns}
        rowHeight={30}
        width={1200}
        onLayoutChange={handleLayoutChange}>
        {teasers.map(([{i, ...LayoutRest}, teaser], index) => (
          <div key={i} data-grid={LayoutRest}>
            <Icon
              icon="close"
              style={{...ItemTopBarStyle, right: '2px'}}
              onClick={() => {
                console.log('dfsa')
              }}
            />
            <Icon icon="thumb-tack" style={{...ItemTopBarStyle, left: '2px'}} />
            <TeaserBlock
              teaser={teaser}
              numColumns={numColumns}
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
          </div>
        ))}
      </GridLayout>
      <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
        <TeaserEditPanel
          initialTeaser={teasers[editIndex][1]!}
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

// NICE to have
// TODO curso grab (probably onDragStart={.../ End={...
// function handleSortStart() {
//   document.documentElement.style.cursor = 'grabbing'
//   document.body.style.pointerEvents = 'none'
// }

// function handleSortEnd({oldIndex, newIndex}: SortEnd) {
//   document.documentElement.style.cursor = ''
//   document.body.style.pointerEvents = ''

export interface TeaserBlockProps {
  teaser: Teaser | null
  // showGrabCursor: boolean
  numColumns: number
  onEdit: () => void
  onChoose: () => void
  onRemove: () => void
}

export function TeaserBlock({teaser, numColumns, onEdit, onChoose, onRemove}: TeaserBlockProps) {
  return (
    <Panel
      bodyFill={true}
      style={{
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
            {contentForTeaser(teaser, numColumns)}

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

export function contentForTeaser(teaser: Teaser, numColumns: number) {
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
  numColumns: number
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

      <Overlay bottom={0} width="100%" padding={10}>
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
      </Overlay>
    </>
  )
}
