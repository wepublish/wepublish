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
  OptionButtonSmall,
  TypograpyTextArea
} from '@karma.run/ui'

import {
  MaterialIconEditOutlined,
  MaterialIconImageOutlined,
  MaterialIconSyncAlt
} from '@karma.run/icons'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImageReference} from '../api/types'
import {ImagedEditPanel} from '../panel/imageEditPanel'

export interface ImageBlockValue {
  image: ImageReference | null
  caption: string
}

export function ImageBlock({value, onChange, allowInit}: BlockProps<ImageBlockValue>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    if (allowInit) {
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
          {value.image && (
            <LayerContainer>
              {/* TODO: Allow layer position, don't fill by default */}
              <Layer style={{right: 0, top: 0, left: 'unset', height: 'auto', width: 'auto'}}>
                <Box margin={Spacing.ExtraSmall} flexDirection="row" justifyContent="flex-end" flex>
                  <OptionButtonSmall
                    icon={MaterialIconImageOutlined}
                    title="Choose Image"
                    onClick={() => setChooseModalOpen(true)}
                  />
                </Box>
                <Box margin={Spacing.ExtraSmall} flexDirection="row" justifyContent="flex-end" flex>
                  <OptionButtonSmall
                    icon={MaterialIconEditOutlined}
                    title="Edit Image"
                    onClick={() => setEditModalOpen(true)}
                  />
                </Box>
                <Box margin={Spacing.ExtraSmall} flexDirection="row" justifyContent="flex-end" flex>
                  <OptionButtonSmall
                    icon={MaterialIconSyncAlt}
                    title="Use as Meta Image"
                    onClick={() => setChooseModalOpen(true)}
                  />
                </Box>
              </Layer>
              <Image src={value.image.url} height={300} contain />
            </LayerContainer>
          )}
        </PlaceholderInput>
      </Box>
      <Box marginTop={Spacing.ExtraSmall}>
        <TypograpyTextArea variant="subtitle2" align="center" placeholder="Caption" />
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
        {() => <ImagedEditPanel id={value.image!.id} onClose={() => setEditModalOpen(false)} />}
      </Drawer>
    </>
  )
}
