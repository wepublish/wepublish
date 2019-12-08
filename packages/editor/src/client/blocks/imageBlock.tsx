import React, {useState, useEffect} from 'react'

import {
  PlaceholderInput,
  Drawer,
  BlockProps,
  Image,
  Box,
  Layer,
  LayerContainer,
  Spacing,
  IconButton,
  TypographicTextArea
} from '@karma.run/ui'

import {MaterialIconEditOutlined, MaterialIconImageOutlined} from '@karma.run/icons'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImageReference} from '../api/types'
import {ImagedEditPanel} from '../panel/imageEditPanel'

export interface ImageBlockValue {
  readonly image: ImageReference | null
  readonly caption: string
}

export function ImageBlock({value, onChange, autofocus}: BlockProps<ImageBlockValue>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const {image, caption} = value

  useEffect(() => {
    if (autofocus && !value.image) {
      setChooseModalOpen(true)
    }
  }, [])

  function handleImageChange(image: ImageReference | null) {
    onChange({...value, image})
  }

  return (
    <>
      <Box height={300}>
        <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
          {image && (
            <LayerContainer>
              <Layer right={0} top={0}>
                <IconButton
                  icon={MaterialIconImageOutlined}
                  title="Choose Image"
                  onClick={() => setChooseModalOpen(true)}
                  margin={Spacing.ExtraSmall}
                />
                <IconButton
                  icon={MaterialIconEditOutlined}
                  title="Edit Image"
                  onClick={() => setEditModalOpen(true)}
                  margin={Spacing.ExtraSmall}
                />
                {/* TODO: Meta sync */}
                {/* <IconButton
                    icon={MaterialIconSyncAlt}
                    title="Use as Meta Image"
                    onClick={() => setChooseModalOpen(true)}
                  /> */}
              </Layer>
              <Image src={image.transform[0]} width="100%" height={300} contain />
            </LayerContainer>
          )}
        </PlaceholderInput>
      </Box>
      <Box marginTop={Spacing.ExtraSmall}>
        <TypographicTextArea
          variant="subtitle2"
          align="center"
          placeholder="Caption"
          value={caption}
          onChange={e => {
            onChange({...value, caption: e.target.value})
          }}
        />
      </Box>
      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            transformations={[{height: 300}]}
            onClose={() => setChooseModalOpen(false)}
            onSelect={value => {
              setChooseModalOpen(false)
              handleImageChange(value)
            }}
          />
        )}
      </Drawer>
      <Drawer open={isEditModalOpen} width={480}>
        {() => <ImagedEditPanel id={image!.id} onClose={() => setEditModalOpen(false)} />}
      </Drawer>
    </>
  )
}
