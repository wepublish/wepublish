import React, {useState} from 'react'
import {IconButton, Drawer, Panel, Icon, Avatar, InputGroup, InputNumber} from 'rsuite'
import GridLayout, {Layout /* ,WidthProvider, Responsive */} from 'react-grid-layout'
import './teaserFlexGridBlock.less'
import {useTranslation} from 'react-i18next'
import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'
import {TeaserEditPanel} from '../panel/teaserEditPanel'
import {ImageRefFragment, TeaserStyle, PeerWithProfileFragment} from '../api'
import {TeaserFlexGridBlockValue, Teaser, TeaserType, FlexItemLayout} from './types'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {PlaceholderImage} from '../atoms/placeholderImage'
import {BlockProps} from '../atoms/blockList'
import {Overlay} from '../atoms/overlay'
import {Typography} from '../atoms/typography'
import {Toolbar} from '../atoms/toolbar'

// const ResponsiveGridLayout = WidthProvider(Responsive); TODO

export function TeaserFlexGridBlock({value, onChange}: BlockProps<TeaserFlexGridBlockValue>) {
  const [editIndex, setEditIndex] = useState(0)

  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)

  const [addItems, setAddItems] = useState(1)

  const {teasers, layout, numColumns, numRows} = value

  // const {t} = useTranslation()

  function handleTeaserLinkChange(i: number, teaserLink: Teaser | null) {
    onChange({
      ...value,
      teasers: Object.assign([], teasers, {
        [i]: teaserLink || null
      })
    })
  }

  const handleLayoutChange = (layout: Layout[]) => {
    onChange({
      ...value,
      layout: layout.map(({x, y, w, h}) => ({x, y, w, h}))
    })
  }

  const handleRemoveItem = (i: number) => {
    teasers.splice(i, 1)
    layout.splice(i, 1)
    onChange({
      ...value,
      teasers: [...teasers],
      layout: [...layout]
    })
  }

  const handleAddItems = () => {
    for (let i = 0; i < addItems; i++) {
      const itemLayout: FlexItemLayout = {
        x: (layout.length * 2) % numColumns,
        y: Infinity, // puts it at the bottom
        w: 2,
        h: 2
      }
      layout.push(itemLayout)
      teasers.push(null)
    }

    onChange({
      ...value,
      teasers: [...teasers],
      layout: [...layout]
    })
  }

  const setRowHeight = (val: number) => {
    onChange({
      ...value,
      numRows: val
    })
  }

  const setNumColumns = (val: number) => {
    onChange({
      ...value,
      numColumns: val
    })
  }

  const ItemTopBarStyle: React.CSSProperties = {
    position: 'absolute',
    top: '2px',
    cursor: 'pointer'
  }

  return (
    <>
      <Toolbar>
        <InputGroup style={{width: '180px', margin: '0 10'}}>
          <InputGroup.Addon style={{width: '100px'}}>
            {
              (() => 'Num columns')()
              // t('blocks.teaserFlexGrid.addTeasers') TODO
            }
          </InputGroup.Addon>
          <InputNumber
            value={numColumns}
            onChange={val => setNumColumns(Number(val))}
            min={Math.max(...layout.map(({x, w}) => x + w))}
            max={30}
          />
        </InputGroup>

        <InputGroup style={{width: '180px', margin: '0 10'}}>
          <InputGroup.Addon style={{width: '100px'}}>
            {
              (() => 'Row height')()
              // t('blocks.teaserFlexGrid.addTeasers') TODO
            }
          </InputGroup.Addon>
          <InputNumber
            value={numRows}
            onChange={val => setRowHeight(Number(val))}
            min={1}
            max={500}
          />
        </InputGroup>

        <InputGroup style={{width: '180px', margin: '0 10'}}>
          <InputGroup.Button onClick={handleAddItems} color={'green'}>
            {
              // t('blocks.teaserFlexGrid.addTeasers') TODO
              (() => 'add Teasers')()
            }
          </InputGroup.Button>
          <InputNumber
            value={addItems}
            onChange={val => setAddItems(val as number)}
            min={1}
            max={100}
          />
        </InputGroup>
      </Toolbar>

      <p>{JSON.stringify(layout)}</p>
      <GridLayout
        className="layout"
        cols={numColumns}
        rowHeight={numRows}
        width={700}
        layout={layout.map((layout, i) => ({i: String(i), ...layout}))}
        onLayoutChange={handleLayoutChange}>
        {teasers.map((teaser, i) => (
          <div key={String(i)}>
            <Icon
              icon="close"
              // style={{...ItemTopBarStyle, right: '2px'}}
              onClick={() => {
                handleRemoveItem(i)
              }}
            />
            <Icon
              icon="thumb-tack"
              // style={{...ItemTopBarStyle, left: '2px'}}
            />
            <TeaserBlock
              teaser={teaser}
              numColumns={numColumns}
              onEdit={() => {
                setEditIndex(i)
                setEditModalOpen(true)
              }}
              onChoose={() => {
                setEditIndex(i)
                setChooseModalOpen(true)
              }}
              onRemove={() => {
                handleTeaserLinkChange(i, null)
              }}
            />
          </div>
        ))}
      </GridLayout>

      <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
        <TeaserEditPanel
          initialTeaser={teasers[editIndex]!}
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

// TODO: Nice to have
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
      <Overlay
        style={{
          bottom: '0px',
          width: '100%',
          padding: '10'
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
