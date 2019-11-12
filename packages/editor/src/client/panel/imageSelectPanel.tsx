import React, {useEffect, useState} from 'react'
import {MaterialIconClose, MaterialIconCloudUploadOutlined} from '@karma.run/icons'

import {
  Box,
  FileDropInput,
  NavigationButton,
  Panel,
  PanelHeader,
  PanelSection,
  Toast,
  Grid,
  Column,
  Card,
  Spacing,
  Image,
  Button,
  Divider
} from '@karma.run/ui'

import {useImageListQuery} from '../api/imageListQuery'
import {useImageUploadMutation} from '../api/imageUploadMutation'
import {ImageReference} from '../api/types'
import {ImagedEditPanel} from './imageEditPanel'

export interface ImageSelectPanelProps {
  onClose(): void
  onSelect(image: ImageReference): void
}

export function ImageSelectPanel({onClose, onSelect}: ImageSelectPanelProps) {
  const [errorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [upload, {loading, error}] = useImageUploadMutation()

  const [image, setImage] = useState<ImageReference | null>(null)
  const [after, setAfter] = useState<string | undefined>(undefined)
  const [before, setBefore] = useState<string | undefined>(undefined)

  const {data, refetch} = useImageListQuery({
    after,
    before,
    pageLimit: 20,
    transformations: [{width: 220, height: 140}, {height: 300}]
  })

  const images = data?.images.nodes ?? []
  const missingColumns =
    images.length % 2 !== 0 ? new Array(2 - (images.length % 2)).fill(null) : []

  const {startCursor, endCursor, hasPreviousPage, hasNextPage} = data?.images.pageInfo ?? {}

  async function handleDrop(files: File[]) {
    if (files.length === 0) return

    const file = files[0]

    if (!file.type.startsWith('image')) {
      setErrorToastOpen(true)
      setErrorMessage('Invalid Image')
      return
    }

    const response = await upload({
      variables: {images: [file], transformations: [{width: 800, height: 500}]}
    })

    const {
      id,
      width,
      height,
      transform: [url]
    } = response.data!.uploadImages[0]

    setImage({id, width, height, url})
  }

  useEffect(() => {
    if (error) {
      setErrorToastOpen(true)
      setErrorMessage(error.message)
    }
  }, [error])

  if (image?.id) {
    return (
      <ImagedEditPanel
        id={image.id}
        saveLabel="Confirm"
        onClose={() => {
          setImage(null)
          refetch()
        }}
        onSave={() => onSelect(image)}
      />
    )
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title="Select Image"
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label="Close"
              onClick={() => onClose()}
              disabled={loading}
            />
          }
        />
        <PanelSection>
          <Box height={100} marginBottom={Spacing.ExtraSmall}>
            <FileDropInput
              icon={MaterialIconCloudUploadOutlined}
              text="Drop Image Here"
              onDrop={handleDrop}
              disabled={loading}
            />
          </Box>
          <Grid>
            {images.map(({id, width, height, transform: [url, hdURL]}) => (
              <Column key={id} ratio={1 / 2}>
                <Box height={140}>
                  <Card
                    onClick={() => onSelect({id, width, height, url: hdURL})}
                    style={{cursor: 'pointer'}}>
                    <Image src={url} />
                  </Card>
                </Box>
              </Column>
            ))}
            {missingColumns.map((value, index) => (
              <Column key={index} ratio={1 / 2} />
            ))}
          </Grid>
          <Box paddingTop={Spacing.Medium} paddingBottom={Spacing.Medium}>
            <Divider />
          </Box>
          <Box flexDirection="row" flex>
            <Button
              variant="outlined"
              label="Previous"
              disabled={!hasPreviousPage}
              onClick={() => {
                setBefore(startCursor)
                setAfter(undefined)
              }}
            />
            <Box flexGrow={1} />
            <Button
              variant="outlined"
              label="Next"
              disabled={!hasNextPage}
              onClick={() => {
                setAfter(endCursor)
                setBefore(undefined)
              }}
            />
          </Box>
        </PanelSection>
      </Panel>
      <Toast
        type="error"
        open={errorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
