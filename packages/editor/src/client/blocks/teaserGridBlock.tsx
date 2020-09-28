import React, {useState, ReactNode} from 'react'
import nanoid from 'nanoid'

import {
  MaterialIconInsertDriveFileOutlined,
  MaterialIconClose,
  MaterialIconEditOutlined
} from '@karma.run/icons'

import {
  PlaceholderInput,
  Drawer,
  BlockProps,
  Box,
  Spacing,
  IconButton,
  Image,
  Typography,
  ZIndex,
  PlaceholderImage,
  Overlay,
  Card,
  Chip
} from '@karma.run/ui'

import {styled} from '@karma.run/react'

import {SortableElement, SortableContainer, SortEnd} from 'react-sortable-hoc'
import arrayMove from 'array-move'

import {TeaserGridBlockValue, Teaser, TeaserType} from './types'

import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'
import {TeaserEditPanel} from '../panel/teaserEditPanel'
import {ImageRefFragment, TeaserStyle, PeerWithProfileFragment} from '../api'

interface GridElementProps {
  numColumns: number
}

const GridElement = styled('div', ({numColumns}: GridElementProps) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
  gridGap: Spacing.Small,
  userSelect: 'none'
}))

const GridItem = SortableElement((props: TeaserBlockProps) => {
  return <TeaserBlock {...props} />
})

interface GridProps {
  numColumns: number
  children?: ReactNode
}

const Grid = SortableContainer(({children, numColumns}: GridProps) => {
  return <GridElement styleProps={{numColumns}}>{children}</GridElement>
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
        distance={Spacing.ExtraSmall}
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
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <TeaserEditPanel
            initialTeaser={teasers[editIndex][1]!}
            onClose={() => setEditModalOpen(false)}
            onConfirm={teaser => {
              setEditModalOpen(false)
              handleTeaserLinkChange(editIndex, teaser)
            }}
          />
        )}
      </Drawer>
      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <TeaserSelectAndEditPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={teaser => {
              setChooseModalOpen(false)
              handleTeaserLinkChange(editIndex, teaser)
            }}
          />
        )}
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
    <Card
      style={{cursor: showGrabCursor ? 'grab' : ''}}
      height={300}
      overflow="hidden"
      zIndex={ZIndex.Default}>
      <PlaceholderInput onAddClick={onChoose}>
        {teaser && (
          <Box position="relative" width="100%" height="100%">
            {contentForTeaser(teaser, numColumns)}

            <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
              <IconButton
                icon={MaterialIconInsertDriveFileOutlined}
                title="Choose Teaser"
                onClick={onChoose}
                margin={Spacing.ExtraSmall}
              />
              <IconButton
                icon={MaterialIconEditOutlined}
                title="Edit Teaser"
                onClick={onEdit}
                margin={Spacing.ExtraSmall}
              />
              <IconButton
                icon={MaterialIconClose}
                title="Remove Teaser"
                onClick={onRemove}
                margin={Spacing.ExtraSmall}
              />
            </Box>
          </Box>
        )}
      </PlaceholderInput>
    </Card>
  )
}

export function contentForTeaser(teaser: Teaser, numColumns: number) {
  switch (teaser.type) {
    case TeaserType.Article: {
      const states = []

      if (teaser?.article?.draft) states.push('Draft')
      if (teaser?.article?.pending) states.push('Pending')
      if (teaser?.article?.published) states.push('Published')

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

      if (teaser?.article?.draft) states.push('Draft')
      if (teaser?.article?.pending) states.push('Pending')
      if (teaser?.article?.published) states.push('Published')

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

      if (teaser?.page?.draft) states.push('Draft')
      if (teaser?.page?.pending) states.push('Pending')
      if (teaser?.page?.published) states.push('Published')

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
  return (
    <>
      <Box position="absolute" width="100%" height="100%">
        {image ? (
          <Image
            draggable={false}
            src={numColumns === 1 ? image.column1URL ?? '' : image.column6URL ?? ''}
            width="100%"
            height="100%"
          />
        ) : (
          <PlaceholderImage width="100%" height="100%" />
        )}
      </Box>

      <Overlay bottom={0} width="100%" padding={Spacing.ExtraSmall}>
        <Box marginBottom={Spacing.ExtraSmall}>
          {preTitle && (
            <Typography variant="subtitle1" color="white" spacing="small" ellipsize>
              {preTitle}
            </Typography>
          )}
          <Typography variant="body2" color="white" spacing="small">
            {title || 'Untitled'}
          </Typography>
          {lead && (
            <Typography variant="subtitle1" color="white" ellipsize>
              {lead}
            </Typography>
          )}
        </Box>
        {peer && (
          <Box display="flex" marginBottom={Spacing.ExtraSmall}>
            <Chip
              imageURL={peer.profile?.logo?.squareURL ?? undefined}
              label={peer.profile?.name ?? peer.name}
            />
          </Box>
        )}
        <Box display="flex" flexWrap="wrap">
          <Box flexShrink={0} marginRight={Spacing.ExtraSmall}>
            <Typography variant="subtitle1" color="gray">
              Style: {labelForTeaserStyle(style)}
            </Typography>
          </Box>
          <Box flexShrink={0}>
            <Typography variant="subtitle1" color="gray">
              Status: {states?.join(' / ')}
            </Typography>
          </Box>
        </Box>
      </Overlay>
    </>
  )
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
