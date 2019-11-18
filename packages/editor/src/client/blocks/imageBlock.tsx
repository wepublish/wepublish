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
  TypograpyTextArea
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
                <Box margin={Spacing.ExtraSmall} flexDirection="row" justifyContent="flex-end" flex>
                  <IconButton
                    icon={MaterialIconImageOutlined}
                    title="Choose Image"
                    onClick={() => setChooseModalOpen(true)}
                  />
                </Box>
                <Box margin={Spacing.ExtraSmall} flexDirection="row" justifyContent="flex-end" flex>
                  <IconButton
                    icon={MaterialIconEditOutlined}
                    title="Edit Image"
                    onClick={() => setEditModalOpen(true)}
                  />
                </Box>
                <Box margin={Spacing.ExtraSmall} flexDirection="row" justifyContent="flex-end" flex>
                  {/* TODO: Meta sync */}
                  {/* <IconButton
                    icon={MaterialIconSyncAlt}
                    title="Use as Meta Image"
                    onClick={() => setChooseModalOpen(true)}
                  /> */}
                </Box>
              </Layer>
              <Image src={image.url} height={300} contain />
            </LayerContainer>
          )}
        </PlaceholderInput>
      </Box>
      <Box marginTop={Spacing.ExtraSmall}>
        <TypograpyTextArea
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
