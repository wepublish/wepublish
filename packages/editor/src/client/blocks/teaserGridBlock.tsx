import React, {useState, ReactNode} from 'react'
import nanoid from 'nanoid'

import {MaterialIconInsertDriveFileOutlined, MaterialIconClose} from '@karma.run/icons'

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
  Card
} from '@karma.run/ui'

import {styled} from '@karma.run/react'

import {SortableElement, SortableContainer, SortEnd} from 'react-sortable-hoc'
import arrayMove from 'array-move'

import {ArticleRefFragment} from '../api'
import {TeaserGridBlockValue, ArticleTeaser} from './types'

import {ArticleChoosePanel} from '../panel/articleChoosePanel'

interface GridElementProps {
  numColumns: number
}

const GridElement = styled('div', ({numColumns}: GridElementProps) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
  gridGap: Spacing.Small,
  userSelect: 'none'
}))

const GridItem = SortableElement((props: ArticleTeaserBlockProps) => {
  return <ArticleTeaserBlock {...props} />
})

interface GridProps {
  numColumns: number
  children?: ReactNode
}

const Grid = SortableContainer(({children, numColumns}: GridProps) => {
  return <GridElement styleProps={{numColumns}}>{children}</GridElement>
})

export function TeaserGridBlock({value, onChange}: BlockProps<TeaserGridBlockValue>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [choosingIndex, setChoosingIndex] = useState(0)

  const {teasers, numColumns} = value

  function handleArticleChange(index: number, article: ArticleRefFragment | null) {
    const currentValue = teasers[index] || {}

    onChange({
      numColumns,
      teasers: Object.assign([], teasers, {
        [index]: [nanoid(), article ? {...currentValue, article} : null]
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
            onChooseArticle={() => {
              setChoosingIndex(index)
              setChooseModalOpen(true)
            }}
            onRemoveArticle={() => {
              handleArticleChange(index, null)
            }}
          />
        ))}
      </Grid>
      <Drawer open={isChooseModalOpen} width={500}>
        {() => (
          <ArticleChoosePanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={article => {
              setChooseModalOpen(false)
              handleArticleChange(choosingIndex, article)
            }}
          />
        )}
      </Drawer>
    </>
  )
}

export interface ArticleTeaserBlockProps {
  teaser: ArticleTeaser | null
  showGrabCursor: boolean
  numColumns: number
  onChooseArticle: () => void
  onRemoveArticle: () => void
}

export function ArticleTeaserBlock({
  teaser,
  numColumns,
  showGrabCursor,
  onChooseArticle,
  onRemoveArticle
}: ArticleTeaserBlockProps) {
  const states = []

  if (teaser?.article?.draft) states.push('Draft')
  if (teaser?.article?.pending) states.push('Pending')
  if (teaser?.article?.published) states.push('Published')

  return (
    <Card
      style={{cursor: showGrabCursor ? 'grab' : ''}}
      height={300}
      overflow="hidden"
      zIndex={ZIndex.Default}>
      <PlaceholderInput onAddClick={onChooseArticle}>
        {teaser && teaser.article && (
          <Box position="relative" width="100%" height="100%">
            <Box position="absolute" width="100%" height="100%">
              {teaser.article.latest.image ? (
                <Image
                  draggable={false}
                  src={
                    numColumns === 1
                      ? teaser.article.latest.image.column1URL ?? ''
                      : teaser.article.latest.image.column6URL ?? ''
                  }
                  width="100%"
                  height="100%"
                />
              ) : (
                <PlaceholderImage width="100%" height="100%" />
              )}
            </Box>

            <Overlay bottom={0} width="100%" padding={Spacing.ExtraSmall}>
              <Typography variant="subtitle1" color="gray">
                {states.join(' / ')}
              </Typography>
              <Typography variant={numColumns === 1 ? 'h2' : 'body2'} color="white">
                {teaser.article.latest.title || 'Untitled'}
              </Typography>
            </Overlay>

            <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
              <IconButton
                icon={MaterialIconInsertDriveFileOutlined}
                title="Choose Article"
                onClick={onChooseArticle}
                margin={Spacing.ExtraSmall}
              />
              <IconButton
                icon={MaterialIconClose}
                title="Remove Article"
                onClick={onRemoveArticle}
                margin={Spacing.ExtraSmall}
              />
            </Box>
          </Box>
        )}
      </PlaceholderInput>
    </Card>
  )
}
