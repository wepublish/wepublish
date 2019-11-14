import React, {useState} from 'react'

import {PlaceholderInput, Drawer, BlockProps, Box, Grid, Column} from '@karma.run/ui'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImageReference} from '../api/types'

export interface ArticleTeaser {}

export interface TeaserGridBlockValue {
  readonly teasers: Array<ArticleTeaser | null>
}

export function TeaserGridBlock({value, onChange}: BlockProps<TeaserGridBlockValue>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const {teasers} = value

  function handleTeaserChange(image: ImageReference | null) {
    onChange({...value})
  }

  return (
    <>
      <Grid>
        {teasers.map(() => (
          <Column ratio={1 / teasers.length}>
            <Box height={200}>
              <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}></PlaceholderInput>
            </Box>
          </Column>
        ))}
      </Grid>

      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={value => {
              setChooseModalOpen(false)
              handleTeaserChange(value)
            }}
          />
        )}
      </Drawer>
    </>
  )
}
