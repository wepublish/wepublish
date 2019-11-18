import React, {useState} from 'react'

import {
  PlaceholderInput,
  Drawer,
  BlockProps,
  Box,
  Grid,
  Column,
  LayerContainer,
  Layer,
  Spacing,
  IconButton,
  Image,
  Typography
} from '@karma.run/ui'

import {ArticleChoosePanel} from '../panel/articleChoosePanel'
import {ArticleReference} from '../api/types'
import {MaterialIconEditOutlined, MaterialIconDeleteOutlined} from '@karma.run/icons'

export interface ArticleTeaser {
  readonly type: string
  readonly article: ArticleReference
}

export interface TeaserGridBlockValue {
  readonly teasers: Array<ArticleTeaser | null>
}

export function TeaserGridBlock({value, onChange}: BlockProps<TeaserGridBlockValue>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [choosingIndex, setChoosingIndex] = useState(0)

  const {teasers} = value
  const numColumns = teasers.length

  function handleArticleChange(index: number, article: ArticleReference | null) {
    const currentValue = teasers[index] || {}

    onChange({
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
          <Column key={index} ratio={1 / teasers.length}>
            <Box height={numColumns === 1 ? 400 : 300}>
              <PlaceholderInput
                onAddClick={() => {
                  setChoosingIndex(index)
                  setChooseModalOpen(true)
                }}>
                {value && (
                  <LayerContainer>
                    <Layer right={0} top={0}>
                      <IconButton
                        icon={MaterialIconEditOutlined}
                        title="Choose Article"
                        onClick={() => {
                          setChoosingIndex(index)
                          setChooseModalOpen(true)
                        }}
                        margin={Spacing.ExtraSmall}
                      />
                      <IconButton
                        icon={MaterialIconDeleteOutlined}
                        title="Remove Article"
                        onClick={() => {
                          handleArticleChange(index, null)
                        }}
                        margin={Spacing.ExtraSmall}
                      />
                    </Layer>

                    <Layer
                      bottom={0}
                      width={'100%'}
                      height={numColumns === 1 ? 'auto' : '150px'}
                      style={{
                        backgroundColor: numColumns === 1 ? 'rgba(34,34,34,0.6)' : 'white'
                      }}>
                      <Box padding={numColumns === 1 ? Spacing.Small : Spacing.ExtraSmall}>
                        <Typography
                          variant="h2"
                          align={numColumns === 1 ? 'center' : 'left'}
                          color={numColumns === 1 ? 'white' : 'dark'}>
                          {value.article.title || 'Untitled'}
                        </Typography>
                      </Box>
                    </Layer>

                    {value.article.image && <Image src={value.article.image.url} />}
                  </LayerContainer>
                )}
              </PlaceholderInput>
            </Box>
          </Column>
        ))}
      </Grid>

      <Drawer open={isChooseModalOpen} width={480}>
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
