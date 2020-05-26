import React, {useState, useEffect} from 'react'

import {
  PlaceholderInput,
  Drawer,
  BlockProps,
  Image,
  Box,
  Spacing,
  IconButton,
  TypographicTextArea,
  ZIndex,
  Card
} from '@karma.run/ui'

import {MaterialIconEditOutlined, MaterialIconImageOutlined} from '@karma.run/icons'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'
import {ImageRefFragment} from '../api'
import {ImageBlockValue} from './types'

// TODO: Handle disabled prop
export function ImageBlock({value, onChange, autofocus}: BlockProps<ImageBlockValue>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const {image, caption} = value

  useEffect(() => {
    if (autofocus && !value.image) {
      setChooseModalOpen(true)
    }
  }, [])

  function handleImageChange(image: ImageRefFragment | null) {
    onChange({...value, image})
  }

  return (
    <>
      <Card height={300} overflow="hidden">
        <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
          {image && (
            <Box position="relative" width="100%" height="100%">
              <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
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
              </Box>
              {image.largeURL && <Image src={image.largeURL} width="100%" height={300} contain />}
            </Box>
          )}
        </PlaceholderInput>
      </Card>
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
