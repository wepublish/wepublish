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
  Link,
  TagInput
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconSaveOutlined} from '@karma.run/icons'

import {useMutation, useQuery} from '@apollo/react-hooks'
import gql from 'graphql-tag'
import {read} from 'fs'
import {useImageUploadMutation} from '../api/imageMutation'

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
    tags
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
  mutation(
    $id: ID!
    $title: String!
    $description: String!
    $tags: [String!]!
    $focalPoint: InputPoint!
  ) {
    updateImage(
      id: $id
      title: $title
      description: $description
      tags: $tags
      focalPoint: $focalPoint
    ) {
      ...EditImage
    }
  }

  ${EditImageFragment}
`

interface EditImage {
  readonly id?: string

  readonly extension: string
  readonly width: number
  readonly height: number

  readonly createdAt?: string
  readonly fileSize: number

  readonly dataURL?: string
  readonly url?: string
  readonly transform?: string[]

  readonly title?: string
  readonly description?: string
  readonly source?: string
  readonly tags: string[]

  readonly focalPoint?: Point
}

export interface ImageEditPanelProps {
  readonly id?: string
  readonly file?: File

  readonly saveLabel?: string

  onClose?(): void
  onSave?(): void
}

export function ImagedEditPanel({id, file, saveLabel, onClose, onSave}: ImageEditPanelProps) {
  const [isSavedToastOpen, setSavedToastOpen] = useState(false)
  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const [filename, setFilename] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const [focalPoint, setFocalPoint] = useState<Point>()

  const {data, loading, error: loadingError} = useQuery(ImageQuery, {
    variables: {id},
    fetchPolicy: 'network-only',
    skip: id == undefined
  })

  const [editImage, {loading: saving, error: savingError}] = useMutation(ImageMutation)
  const [uploadImage, {loading: uploadLoading, error: uploadError}] = useImageUploadMutation()

  const disabled = loading || saving

  const [image, setImage] = useState<EditImage | null>(null)
  const isUpload = file != undefined

  useEffect(() => {
    if (file) {
      const reader = new FileReader()
      const [filename, ...extensions] = file.name.split('.')
      const extension = `.${extensions.join('.')}`
      const image = new Image()

      function handleReaderLoad() {
        image.src = reader.result as string
      }

      function handleImageLoad() {
        setFilename(filename)

        setImage({
          fileSize: file!.size,
          extension,
          width: image.width,
          height: image.height,
          dataURL: reader.result as string,
          tags: [],
          focalPoint: {x: 0.5, y: 0.5}
        })
      }

      reader.addEventListener('load', handleReaderLoad)
      image.addEventListener('load', handleImageLoad)

      reader.readAsDataURL(file)

      return () => {
        reader.removeEventListener('load', handleReaderLoad)
        image.removeEventListener('load', handleImageLoad)
      }
    }

    return () => {}
  }, [id, file])

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
      setTitle(image.title ?? '')
      setDescription(image.description ?? '')
      setFocalPoint(image.focalPoint)
    }
  }, [image])

  async function handleSave() {
    if (isUpload) {
      await uploadImage({
        variables: {
          input: {
            file: file!,
            filename: filename || undefined,
            title: title || undefined,
            description: description || undefined,
            source: source || undefined,
            tags
          },
          transformations: []
        }
      })
    } else {
      await editImage({variables: {id, title, description, tags: [], focalPoint}})
      setSavedToastOpen(true)
      onSave?.()
    }
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={isUpload ? 'Upload Image' : 'Edit Image'}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={isUpload ? 'Cancel' : 'Close'}
              onClick={() => onClose?.()}
              disabled={disabled}
            />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconSaveOutlined}
              label={isUpload ? 'Upload' : saveLabel ?? 'Save'}
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
                  imageURL={image.transform?.[0] ?? image.url ?? image.dataURL!}
                  imageWidth={image.width}
                  imageHeight={image.height}
                  maxHeight={300}
                  focalPoint={focalPoint}
                  onChange={point => setFocalPoint(point)}
                />
              </Box>
              <DescriptionList>
                <DescriptionListItem label="Filename">
                  {filename}
                  {image.extension}
                </DescriptionListItem>
                <DescriptionListItem label="Dimension">
                  {image.width} x {image.height}
                </DescriptionListItem>
                {image.createdAt && (
                  <DescriptionListItem label="Created">
                    {new Date(image.createdAt).toLocaleString()}
                  </DescriptionListItem>
                )}
                <DescriptionListItem label="File Size">
                  {prettyBytes(image.fileSize)}
                </DescriptionListItem>
                {image.url && (
                  <DescriptionListItem label="Link">
                    <Link href={image.url} target="_blank">
                      {image.url}
                    </Link>
                  </DescriptionListItem>
                )}
              </DescriptionList>
            </PanelSection>
            <PanelSectionHeader title="Information" />
            <PanelSection>
              <TextInput
                label="Filename"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                disabled={disabled}
                marginBottom={Spacing.Small}
              />
              <TextInput
                label="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={disabled}
                marginBottom={Spacing.Small}
              />
              <TextInput
                label="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={disabled}
                marginBottom={Spacing.Small}
              />
              <TextInput
                label="Source"
                value={source}
                onChange={e => setSource(e.target.value)}
                disabled={disabled}
                marginBottom={Spacing.Small}
              />
              <TagInput label="Tags" value={tags} onChange={tags => setTags(tags ?? [])} />
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
