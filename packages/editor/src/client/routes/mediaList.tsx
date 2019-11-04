import React, {useState} from 'react'

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
  ImageListInput,
  IconButton,
  Image,
  FileDropInput
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconCloudUploadOutlined} from '@karma.run/icons'
import {useMutation, useQuery} from '@apollo/react-hooks'
import gql from 'graphql-tag'

const ImagesQuery = gql`
  {
    images(offset: 0, limit: 10) @connection(key: "imageConnection") {
      nodes {
        id
        transform(transformations: [{width: 300}])
      }
    }
  }
`

interface Image {
  readonly id: string
  readonly transform: string[]
}

export function MediaList() {
  const [isUploadModalOpen, setUploadModalOpen] = useState(false)
  const {data, refetch} = useQuery(ImagesQuery)

  const images: Image[] = data ? data.images.nodes : []
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
                <Image src={url} />
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
          <ImageUploadPanel
            onClose={() => setUploadModalOpen(false)}
            onUpload={() => {
              setUploadModalOpen(false)
              refetch()
            }}
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

export interface ImageUploadProps {
  onClose(): void
  onUpload(imageIDs: string[]): void
}

export function ImageUploadPanel({onClose, onUpload}: ImageUploadProps) {
  const [images, setImages] = useState<File[]>([])
  const [upload, {loading, error, called}] = useMutation(UploadMutation)

  async function handleUpload() {
    const response = await upload({variables: {images}})
    const uploadedImages = response.data.uploadImages

    onUpload(uploadedImages)
  }

  return (
    <Panel>
      <PanelHeader
        title="Upload Images"
        leftChildren={
          <IconButton
            icon={MaterialIconClose}
            label="Cancel"
            onClick={() => onClose()}
            disabled={loading}
          />
        }
        rightChildren={
          <IconButton
            icon={MaterialIconCloudUploadOutlined}
            label="Upload"
            onClick={() => handleUpload()}
            disabled={loading || images.length === 0}
          />
        }
      />
      <PanelSection>
        <Box height={100}>
          <FileDropInput />
        </Box>

        {error && error.message}
        {called || loading ? (
          'Uploading...'
        ) : (
          <ImageListInput images={images} onChange={setImages} />
        )}
      </PanelSection>
    </Panel>
  )
}
