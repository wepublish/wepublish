import React, {useState, useEffect} from 'react'
import prettyBytes from 'pretty-bytes'

import {
  Box,
  Spacing,
  Panel,
  PanelHeader,
  PanelSection,
  Toast,
  NavigationButton,
  FocalPointInput,
  DescriptionList,
  DescriptionListItem,
  PanelSectionHeader,
  TextInput,
  Point,
  Link
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconSaveOutlined} from '@karma.run/icons'

import {useMutation, useQuery} from '@apollo/react-hooks'
import gql from 'graphql-tag'

const EditImageFragment = gql`
  fragment EditImage on Image {
    id
    createdAt
    filename
    extension
    width
    height
    url
    fileSize
    title
    description
    focalPoint {
      x
      y
    }
    transform(transformations: [{height: 300}])
  }
`

const ImageQuery = gql`
  query($id: ID!) {
    image(id: $id) {
      ...EditImage
    }
  }

  ${EditImageFragment}
`

const ImageMutation = gql`
  mutation($id: ID!, $title: String!, $description: String!, $focalPoint: InputPoint!) {
    updateImage(id: $id, title: $title, description: $description, focalPoint: $focalPoint) {
      ...EditImage
    }
  }

  ${EditImageFragment}
`

interface EditImage {
  readonly id: string
  readonly filename: string
  readonly extension: string
  readonly width: number
  readonly height: number
  readonly createdAt: string
  readonly fileSize: number
  readonly url: string
  readonly transform: string[]
  readonly focalPoint: Point | null
  readonly title: string
  readonly description: string
}

export interface ImageEditPanelProps {
  readonly id: string
  readonly saveLabel?: string

  onClose?(): void
  onSave?(): void
}

export function ImagedEditPanel({id, saveLabel, onClose, onSave}: ImageEditPanelProps) {
  const [isSavedToastOpen, setSavedToastOpen] = useState(false)
  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [focalPoint, setFocalPoint] = useState<Point | null>(null)

  const {data, loading, error: loadingError} = useQuery(ImageQuery, {variables: {id}})
  const [editImage, {loading: saving, error: savingError}] = useMutation(ImageMutation)

  const disabled = loading || saving
  const image: EditImage | null = data?.image ?? null

  useEffect(() => {
    if (loadingError) {
      setErrorToastOpen(true)
      setErrorMessage(loadingError.message)
    }

    if (savingError) {
      setErrorToastOpen(true)
      setErrorMessage(savingError.message)
    }
  }, [loadingError, savingError])

  useEffect(() => {
    if (image) {
      setTitle(image.title)
      setDescription(image.description)
      setFocalPoint(image.focalPoint)
    }
  }, [image])

  async function handleSave() {
    await editImage({variables: {id, title, description, tags: [], focalPoint}})
    setSavedToastOpen(true)
    onSave?.()
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title="Edit Image"
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label="Close"
              onClick={() => onClose?.()}
              disabled={disabled}
            />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconSaveOutlined}
              label={saveLabel ?? 'Save'}
              onClick={() => handleSave()}
              disabled={disabled}
            />
          }
        />
        {image && (
          <>
            <PanelSection dark>
              <Box marginBottom={Spacing.Medium}>
                <FocalPointInput
                  imageURL={image.transform[0]}
                  imageWidth={image.width}
                  imageHeight={image.height}
                  maxHeight={300}
                  focalPoint={focalPoint}
                  onChange={point => setFocalPoint(point)}
                />
              </Box>
              <DescriptionList>
                <DescriptionListItem label="Filename">
                  {image.filename}
                  {image.extension}
                </DescriptionListItem>
                <DescriptionListItem label="Dimension">
                  {image.width} x {image.height}
                </DescriptionListItem>
                <DescriptionListItem label="Created">
                  {new Date(image.createdAt).toLocaleString()}
                </DescriptionListItem>
                <DescriptionListItem label="File Size">
                  {prettyBytes(image.fileSize)}
                </DescriptionListItem>
                <DescriptionListItem label="Link">
                  <Link href={image.url} target="_blank">
                    {image.url}
                  </Link>
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
            <PanelSectionHeader title="Information" />
            <PanelSection>
              <Box marginBottom={Spacing.Small}>
                <TextInput
                  label="Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={disabled}
                />
              </Box>
              <Box marginBottom={Spacing.Small}>
                <TextInput
                  label="Description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={disabled}
                />
              </Box>
            </PanelSection>
          </>
        )}
      </Panel>

      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>

      <Toast
        type="success"
        open={isSavedToastOpen}
        autoHideDuration={2000}
        onClose={() => setSavedToastOpen(false)}>
        Image Updated
      </Toast>
    </>
  )
}
