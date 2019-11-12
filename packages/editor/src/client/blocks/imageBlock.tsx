import React, {useState, useEffect} from 'react'

import {
  PlaceholderInput,
  Drawer,
  FieldProps,
  Image,
  Box,
  Layer,
  LayerContainer,
  Spacing,
  OptionButtonSmall
} from '@karma.run/ui'

import {MaterialIconEditOutlined} from '@karma.run/icons'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImageReference} from '../api/types'

export function ImageBlock({value, onChange}: FieldProps<ImageReference | null>) {
  const [isModalOpen, setModalOpen] = useState(false)

  useEffect(() => setModalOpen(true), [])

  return (
    <>
      <Box height={300}>
        <PlaceholderInput onAddClick={() => setModalOpen(true)}>
          {value && (
            <LayerContainer>
              <Layer>
                <Image src={value.url} height={300} contain />
              </Layer>
              <Layer>
                <Box
                  padding={Spacing.ExtraSmall}
                  flexDirection="row"
                  justifyContent="flex-end"
                  flex>
                  <OptionButtonSmall
                    icon={MaterialIconEditOutlined}
                    onClick={() => setModalOpen(true)}
                  />
                </Box>
              </Layer>
            </LayerContainer>
          )}
        </PlaceholderInput>
      </Box>
      <Drawer open={isModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setModalOpen(false)}
            onSelect={value => {
              setModalOpen(false)
              onChange(value)
            }}
          />
        )}
      </Drawer>
    </>
  )
}
