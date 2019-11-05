import React, {useState, useEffect} from 'react'

import {
  Typography,
  Box,
  Spacing,
  Grid,
  Column,
  PrimaryButton,
  Drawer,
  Panel,
  PanelHeader,
  PanelSection,
  IconButton,
  Image as ListImage,
  FileDropInput,
  Toast,
  FocalPointSetter,
  ImageMeta
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconCloudUploadOutlined} from '@karma.run/icons'
import {useMutation, useQuery} from '@apollo/react-hooks'
import gql from 'graphql-tag'

const ImagesQuery = gql`
  {
    images(offset: 0, limit: 10) {
      nodes {
        id
        transform(transformations: [{width: 300}])
      }
    }
  }
`

interface ListImage {
  readonly id: string
  readonly transform: string[]
}

export function MediaList() {
  const [isUploadModalOpen, setUploadModalOpen] = useState(false)
  const {data, refetch} = useQuery(ImagesQuery)

  const images: ListImage[] = data ? data.images.nodes : []
  const missingColumns = new Array(3 - (images.length % 3)).fill(null)

  return (
    <>
      <Box flexDirection="row" marginBottom={Spacing.Medium} flex>
        <Typography variant="h1">Media Library</Typography>
        <Box flexGrow={1} />
        <PrimaryButton label="Upload Image" onClick={() => setUploadModalOpen(true)} />
      </Box>
      <Box>
        <Grid spacing={Spacing.Small}>
          {images.map(({id, transform: [url]}) => (
            <Column key={id} ratio={1 / 3}>
              <Box height={200}>
                <ListImage src={url} />
              </Box>
            </Column>
          ))}
          {missingColumns.map((value, index) => (
            <Column key={index} ratio={1 / 3}></Column>
          ))}
        </Grid>
      </Box>
      <Drawer open={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} width={480}>
        {() => (
          <ImageUploadAndEditPanel
            onClose={() => setUploadModalOpen(false)}
            onUpload={() => refetch()}
          />
        )}
      </Drawer>
    </>
  )
}

const UploadMutation = gql`
  mutation($images: [Upload!]!) {
    uploadImages(images: $images) {
      id
    }
  }
`
export interface ImageUploadAndEditPanelProps {
  onClose(): void
  onUpload(imageIDs: string[]): void
}

export function ImageUploadAndEditPanel({onClose, onUpload}: ImageUploadAndEditPanelProps) {
  const [imageID, setImageID] = useState<string | null>(null)

  function handleUpload(imageIDs: string[]) {
    setImageID(imageIDs[0])
    onUpload(imageIDs)
  }

  return imageID ? (
    <ImagedEditPanel imageID={imageID} onClose={onClose} />
  ) : (
    <ImageUploadPanel onClose={onClose} onUpload={handleUpload} />
  )
}

export interface ImageUploadPanelProps {
  onClose(): void
  onUpload(imageIDs: string[]): void
}

export function ImageUploadPanel({onClose, onUpload}: ImageUploadPanelProps) {
  const [errorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [upload, {loading, error}] = useMutation(UploadMutation)

  async function handleDrop(files: File[]) {
    if (files.length === 0) return

    const file = files[0]

    if (!file.type.startsWith('image')) {
      setErrorToastOpen(true)
      setErrorMessage('Invalid Image')
      return
    }

    const response = await upload({variables: {images: [file]}})
    const uploadedImages = response.data.uploadImages.map(({id}: {id: string}) => id)

    onUpload(uploadedImages)
  }

  useEffect(() => {
    if (error) {
      setErrorToastOpen(true)
      setErrorMessage(error.message)
    }
  }, [error])

  return (
    <>
      <Panel>
        <PanelHeader
          title="Upload Image"
          leftChildren={
            <IconButton
              icon={MaterialIconClose}
              label="Close"
              onClick={() => onClose()}
              disabled={loading}
            />
          }
        />
        <PanelSection>
          <Box height={100}>
            <FileDropInput
              icon={MaterialIconCloudUploadOutlined}
              text="Drop Image Here"
              onDrop={handleDrop}
              disabled={loading}
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

const ImageQuery = gql`
  query($imageID: ID!) {
    image(id: $imageID) {
      id
      createdAt
      filename
      extension
      width
      height
      url
      fileSize
      transform(transformations: [{width: 300}])
    }
  }
`

interface Image {
  readonly id: string
  readonly filename: string
  readonly extension: string
  readonly width: number
  readonly height: number
  readonly createdAt: string
  readonly fileSize: number
  readonly url: string
  readonly transform: string[]
}

export interface ImageEditPanelProps {
  readonly imageID: string

  onClose(): void
}

export function ImagedEditPanel({imageID, onClose}: ImageEditPanelProps) {
  const [errorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {data, loading, error} = useQuery(ImageQuery, {variables: {imageID}})
  const image: Image | null = data ? data.image : null

  useEffect(() => {
    if (error) {
      setErrorToastOpen(true)
      setErrorMessage(error.message)
    }
  }, [error])

  return (
    <>
      <Panel>
        <PanelHeader
          title="Edit Image"
          leftChildren={
            <IconButton
              icon={MaterialIconClose}
              label="Close"
              onClick={() => onClose()}
              disabled={loading}
            />
          }
        />
        {image && (
          <ImageMeta
            file={{
              src: image.transform[0],
              name: `${image.filename}${image.extension}`,
              width: image.width,
              height: image.height,
              date: image.createdAt,
              size: image.fileSize,
              link: image.url
            }}
          />
        )}
        <PanelSection></PanelSection>
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
