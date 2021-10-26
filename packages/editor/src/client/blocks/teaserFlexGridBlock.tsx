import React, {useState} from 'react'
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
  TeaserFlexGridBlockValue
  // Teaser,
  // TeaserType,
  // FlexTeaserPlacement,
  // FlexGridItemLayout
} from './types'
import {BlockProps} from '../atoms/blockList'
import nanoid from 'nanoid'
import {Icon, IconButton, Panel} from 'rsuite'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {contentForTeaser, TeaserBlock, TeaserBlockProps} from './teaserGridBlock'
import {PlaceholderInput} from '../atoms/placeholderInput'

// import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'
// import {TeaserEditPanel} from '../panel/teaserEditPanel'
// import {ImageRefFragment, TeaserStyle, PeerWithProfileFragment} from '../api'

// import {useTranslation} from 'react-i18next'

export function TeaserFlexGridBlock({value, onChange}: BlockProps<TeaserFlexGridBlockValue>) {
  // const [editIndex, setEditIndex] = useState(0)

  // const [isEditModalOpen, setEditModalOpen] = useState(false)
  // const [isChooseModalOpen, setChooseModalOpen] = useState(false)

  const [flexTeasers, setFlexTeasers] = useState(value.flexTeasers)

  const alignment: FlexItemAlignment[] = []
  flexTeasers.map(flexTeaser => {
    alignment.push(flexTeaser.alignment)
  })
  const [layout, setLayout] = useState(alignment)

  const teasers = flexTeasers.map(flexTeaser => flexTeaser.teaser)

  const handleLayoutChange = (layout: FlexItemAlignment[]) => {
    setLayout(layout)
    onChange({
      ...value,
      flexTeasers: flexTeasers.map((flexTeaser, i) => {
        return {
          teaser: flexTeaser.teaser,
          alignment: layout[i]
        }
      })
    })
  }

  const handleAddTeaser = () => {
    const newTeaser: FlexTeaser = {
      alignment: {
        i: nanoid(),
        x: Infinity,
        y: Infinity, // puts it at the bottom
        w: 2,
        h: 2
      },
      teaser: null
    }
    flexTeasers.push(newTeaser)
    onChange({
      ...value,
      flexTeasers: [...flexTeasers]
    })
  }

  const handleRemoveTeaser = (index: number) => {
    flexTeasers.splice(index, 1)
    onChange({
      ...value,
      flexTeasers: [...flexTeasers]
    })
  }

  // function handleTeaserLinkChange(index: number, teaserLink: Teaser | null) {
  // onChange({
  // numColumns,
  // teasers: Object.assign([], teasers, {
  //   [index]: [nanoid(), teaserLink || null]
  // })
  // })
  // }

  // function handleSortStart() {
  // document.documentElement.style.cursor = 'grabbing'
  // document.body.style.pointerEvents = 'none'
  // }

  // function handleSortEnd({oldIndex, newIndex}: SortEnd) {
  //   document.documentElement.style.cursor = ''
  //   document.body.style.pointerEvents = ''

  // onChange({
  //   numColumns,
  //   teasers: arrayMove(teasers, oldIndex, newIndex)
  // })
  // }

  return (
    <>
      <p>{JSON.stringify(layout)}</p>
      <p>{JSON.stringify(teasers)}</p>
      <IconButtonTooltip caption="add">
        <IconButton icon={<Icon icon="plus" />} circle size="sm" onClick={handleAddTeaser} />
      </IconButtonTooltip>
      <GridLayout
        // onDragStart={handleSortStart}
        // onDragStop={() => handleSortEnd}
        onLayoutChange={handleLayoutChange}
        layout={layout}
        className="layout"
        cols={12}
        rowHeight={30}
        width={1200}>
        {value.flexTeasers.map((flexTeaser, i) => (
          <div key={flexTeaser.alignment.i} style={{backgroundColor: 'lightgray'}}>
            {flexTeaser.teaser}
            <FlexTeaserBlock
              teaser={flexTeaser.teaser}
              showGrabCursor={teasers.length !== 1}
              onEdit={() => console.log('edit')}
              onChoose={() => console.log('choose')}
              onRemove={() => console.log('remove')}
            />
            <IconButtonTooltip caption="delete">
              <IconButton
                icon={<Icon icon="trash" />}
                circle
                size="sm"
                onClick={() => handleRemoveTeaser(i)}
              />
            </IconButtonTooltip>
          </div>
        ))}
      </GridLayout>
    </>
  )
}

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
// <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
//   <TeaserEditPanel
//     initialTeaser={teasers[editIndex][1]!}
//     onClose={() => setEditModalOpen(false)}
//     onConfirm={teaser => {
//       setEditModalOpen(false)
//       handleTeaserLinkChange(editIndex, teaser)
//     }}
//   />
// </Drawer>
// <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
//   <TeaserSelectAndEditPanel
//     onClose={() => setChooseModalOpen(false)}
//     onSelect={teaser => {
//       setChooseModalOpen(false)
//       handleTeaserLinkChange(editIndex, teaser)
//     }}
//   />
// </Drawer>
// </>

/*
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
      bodyFill={true}
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
  layout: FlexTeaserSize[]
}
export interface FlexTeaserSize {
  i: string
  x: number
  y: number
  w: number
  h: number
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
          padding: '10px'
        }}>
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
*/
