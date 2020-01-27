import React, {useState, useRef} from 'react'

import {MaterialIconInsertDriveFileOutlined, MaterialIconClose} from '@karma.run/icons'

import {
  PlaceholderInput,
  Drawer,
  BlockProps,
  Box,
  Grid,
  Column,
  Spacing,
  IconButton,
  Image,
  Typography,
  ZIndex,
  ImagePlaceholder
} from '@karma.run/ui'

import {ArticleReference} from '../api/article'
import {TeaserGridBlockValue, ArticleTeaser} from '../api/blocks'

import {ArticleChoosePanel} from '../panel/articleChoosePanel'
import {VersionState} from '../api/common'

export function TeaserGridBlock({value, onChange}: BlockProps<TeaserGridBlockValue>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [choosingIndex, setChoosingIndex] = useState(0)

  const {teasers, numColumns} = value

  function handleArticleChange(index: number, article: ArticleReference | null) {
    const currentValue = teasers[index] || {}

    onChange({
      numColumns,
      teasers: Object.assign([], teasers, {
        [index]: article ? {...currentValue, article} : null
      })
    })
  }

  return (
    <>
      <Grid spacing={Spacing.ExtraSmall}>
        {teasers.map((value, index) => (
          // NOTE: Using index as a key here should be fine.
          <Column key={index} ratio={1 / numColumns}>
            <Box height={300}>
              <ArticleTeaserBlock
                teaser={value}
                onChooseArticle={() => {
                  setChoosingIndex(index)
                  setChooseModalOpen(true)
                }}
                onRemoveArticle={() => {
                  handleArticleChange(index, null)
                }}
              />
            </Box>
          </Column>
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
  onChooseArticle: () => void
  onRemoveArticle: () => void
}

export function ArticleTeaserBlock({
  teaser,
  onChooseArticle,
  onRemoveArticle
}: ArticleTeaserBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  function handleDragStart() {
    containerRef.current!.style.transform = '0.5'
  }

  return (
    <Box ref={containerRef} style={{cursor: 'move'}} onDragStart={handleDragStart}>
      <PlaceholderInput onAddClick={onChooseArticle}>
        {teaser && teaser.article && (
          <Box position="relative" width="100%" height="100%">
            <Box position="absolute" width="100%" height="100%">
              {teaser.article.latest.image ? (
                <Image src={teaser.article.latest.image.column6URL} width="100%" height="100%" />
              ) : (
                <ImagePlaceholder width="100%" height="100%" />
              )}
            </Box>

            <Box
              position="absolute"
              zIndex={ZIndex.Default}
              bottom={0}
              width="100%"
              padding={Spacing.ExtraSmall}
              paddingTop={Spacing.Large}
              style={{
                background: `linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) ${Spacing.Large}px)`
              }}>
              <Typography variant="subtitle1" color="gray">
                {teaser.article.publishedAt != undefined && 'Published'}
                {teaser.article.latest.state === VersionState.Draft &&
                  teaser.article.publishedAt != undefined &&
                  ' / '}
                {teaser.article.latest.state === VersionState.Draft && 'Draft'}
              </Typography>
              <Typography variant="body2" color="white">
                {teaser.article.latest.title || 'Untitled'}
              </Typography>
            </Box>

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
    </Box>
  )
}
