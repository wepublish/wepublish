import React, {useState} from 'react'
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
import {ImageReference, ImageTransformation} from '../api/types'
import {ImagedEditPanel} from './imageEditPanel'

export interface ImageSelectPanelProps {
  readonly transformations?: ImageTransformation[]

  onClose(): void
  onSelect(image: ImageReference): void
}

export function ImageSelectPanel({onClose, transformations = [], onSelect}: ImageSelectPanelProps) {
  const [errorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [after, setAfter] = useState<string | undefined>(undefined)
  const [before, setBefore] = useState<string | undefined>(undefined)

  const [file, setFile] = useState<File | null>(null)
  const {data, loading: isLoading} = useImageListQuery({
    after,
    before,
    pageLimit: 20,
    transformations: [{width: 220, height: 140}, ...transformations]
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

    setFile(file)
  }

  if (file) {
    return (
      <ImagedEditPanel
        file={file}
        transformations={transformations}
        onSave={image => onSelect(image)}
      />
    )
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title="Choose Image"
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label="Close"
              onClick={() => onClose()}
              disabled={isLoading}
            />
          }
        />
        <PanelSection>
          <Box height={100} marginBottom={Spacing.ExtraSmall}>
            <FileDropInput
              icon={MaterialIconCloudUploadOutlined}
              text="Drop Image Here"
              onDrop={handleDrop}
              disabled={isLoading}
            />
          </Box>
          <Grid>
            {images.map(({id, width, height, url, transform}) => (
              <Column key={id} ratio={1 / 2}>
                <Box height={140}>
                  <Card
                    onClick={() =>
                      onSelect({
                        id,
                        width,
                        height,
                        url,
                        transform: transform.slice(1)
                      })
                    }
                    width="100%"
                    overflow="hidden"
                    style={{cursor: 'pointer'}}>
                    {/* TODO: Add Clickable */}
                    <Image width="100%" height="100%" src={transform[0]} />
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
          <Box flexDirection="row" display="flex">
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
