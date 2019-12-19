import React, {useState} from 'react'

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
  ZIndex
} from '@karma.run/ui'

import {ArticleReference} from '../api/article'
import {TeaserGridBlockValue} from '../api/blocks'

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
            <Box height={numColumns === 1 ? 400 : 300}>
              <PlaceholderInput
                onAddClick={() => {
                  setChoosingIndex(index)
                  setChooseModalOpen(true)
                }}>
                {value && value.article && (
                  <Box position="relative" width="100%" height="100%">
                    <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
                      <IconButton
                        icon={MaterialIconInsertDriveFileOutlined}
                        title="Choose Article"
                        onClick={() => {
                          setChoosingIndex(index)
                          setChooseModalOpen(true)
                        }}
                        margin={Spacing.ExtraSmall}
                      />
                      <IconButton
                        icon={MaterialIconClose}
                        title="Remove Article"
                        onClick={() => {
                          handleArticleChange(index, null)
                        }}
                        margin={Spacing.ExtraSmall}
                      />
                    </Box>

                    {numColumns === 1 ? (
                      <>
                        <Box
                          position="absolute"
                          bottom={0}
                          width={'100%'}
                          height={'auto'}
                          style={{backgroundColor: 'rgba(34,34,34,0.6)'}}>
                          <Box padding={Spacing.Small}>
                            <Typography variant="h2" align="center" color="white">
                              {value.article.latest.title || 'Untitled'}
                            </Typography>
                            <Typography variant="subtitle1" align="center" color="gray">
                              {value.article.publishedAt != undefined && 'Published'}
                              {value.article.publishedAt != undefined &&
                                value.article.latest.state === VersionState.Draft &&
                                ' / '}
                              {value.article.latest.state === VersionState.Draft && 'Draft'}
                            </Typography>
                          </Box>
                        </Box>

                        {value.article.latest.image && (
                          <Image
                            src={value.article.latest.image.column1URL}
                            width="100%"
                            height="100%"
                          />
                        )}
                      </>
                    ) : (
                      <Box display="flex" flexDirection="column">
                        <Image
                          src={value.article.latest.image?.column6URL}
                          width="100%"
                          height={150}
                        />

                        <Box height={150} padding={Spacing.ExtraSmall}>
                          <Typography variant="h2" color="dark">
                            {value.article.latest.title || 'Untitled'}
                          </Typography>
                          <Typography variant="subtitle1" color="gray">
                            {value.article.publishedAt != undefined && 'Published'}
                            {value.article.latest.state === VersionState.Draft &&
                              value.article.publishedAt != undefined &&
                              ' / '}
                            {value.article.latest.state === VersionState.Draft && 'Draft'}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </PlaceholderInput>
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
