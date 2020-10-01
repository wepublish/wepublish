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

import {
  useUploadImageMutation,
  useUpdateImageMutation,
  useImageQuery,
  ImageRefFragment,
  ImageListDocument
} from '../api'
import {getOperationNameFromDocument} from '../utility'

export interface ImageEditPanelProps {
  readonly id?: string
  readonly file?: File

  onClose?(): void
  onSave?(image: ImageRefFragment): void
}

export function ImagedEditPanel({id, file, onClose, onSave}: ImageEditPanelProps) {
  const [isSavedToastOpen, setSavedToastOpen] = useState(false)
  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const [filename, setFilename] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const [author, setAuthor] = useState('')
  const [source, setSource] = useState('')
  const [license, setLicense] = useState('')

  const [fileSize, setFileSize] = useState(0)
  const [extension, setExtension] = useState('')

  const [originalImageURL, setOriginalImageURL] = useState<string>()

  const [imageURL, setImageURL] = useState('')
  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)

  const [createdAt, setCreatedAt] = useState<string>()
  const [updatedAt, setUpdatedAt] = useState<string>()

  const [focalPoint, setFocalPoint] = useState<Point>()

  const {data, error: loadingError} = useImageQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const [updateImage, {loading: isUpdating, error: savingError}] = useUpdateImageMutation()

  const [uploadImage, {loading: isUploading, error: uploadError}] = useUploadImageMutation({
    refetchQueries: [getOperationNameFromDocument(ImageListDocument)]
  })

  const [isLoading, setLoading] = useState(true)
  const isDisabled = isLoading || isUpdating || isUploading
  const isUpload = file !== undefined

  useEffect(() => {
    if (file) {
      const reader = new FileReader()
      const [filename, ...extensions] = file.name.split('.')
      const extension = `.${extensions.join('.')}`
      const image = new Image()

      const handleReaderLoad = function () {
        image.src = reader.result as string
      }

      const handleImageLoad = function () {
        setCreatedAt(undefined)
        setUpdatedAt(undefined)

        setFilename(filename)
        setFileSize(file!.size)
        setExtension(extension)

        setOriginalImageURL(undefined)
        setImageURL(reader.result as string)
        setImageWidth(image.width)
        setImageHeight(image.height)
        setFocalPoint({x: 0.5, y: 0.5})

        setLoading(false)
      }

      reader.addEventListener('load', handleReaderLoad)
      image.addEventListener('load', handleImageLoad)

      reader.readAsDataURL(file)

      return () => {
        reader.removeEventListener('load', handleReaderLoad)
        image.removeEventListener('load', handleImageLoad)
      }
    } else if (data) {
      const {image} = data

      if (image) {
        setCreatedAt(image.createdAt)
        setUpdatedAt(image.modifiedAt)

        setFilename(image.filename || '')
        setFileSize(image.fileSize)
        setExtension(image.extension)

        setTitle(image.title ?? '')
        setDescription(image.description ?? '')
        setTags(image.tags)

        setAuthor(image.author ?? '')
        setSource(image.source ?? '')
        setLicense(image.license ?? '')

        setOriginalImageURL(image.url ?? '')
        setImageURL(image.mediumURL ?? '')
        setImageWidth(image.width)
        setImageHeight(image.height)
        setFocalPoint(image.focalPoint ?? undefined)

        setLoading(false)
      } else {
        setErrorToastOpen(true)
        setErrorMessage('Image not found!')
      }
    }

    return () => {
      /* do nothing */
    }
  }, [file, data])

  useEffect(() => {
    if (loadingError) {
      setErrorToastOpen(true)
      setErrorMessage(loadingError.message)
    }

    if (savingError) {
      setErrorToastOpen(true)
      setErrorMessage(savingError.message)
    }

    if (uploadError) {
      setErrorToastOpen(true)
      setErrorMessage(uploadError.message)
    }
  }, [loadingError, savingError, uploadError])

  async function handleSave() {
    const commonInput = {
      filename: filename || undefined,
      title: title || undefined,
      description: description || undefined,
      tags,

      author: author || undefined,
      source: source || undefined,
      license: license || undefined,

      focalPoint
    }

    if (isUpload) {
      const {data} = await uploadImage({
        variables: {
          input: {file: file!, ...commonInput}
        }
      })

      if (data?.uploadImage) {
        onSave?.(data.uploadImage)
      }
    } else {
      const {data} = await updateImage({
        variables: {id: id!, input: commonInput}
      })

      setSavedToastOpen(true)

      if (data?.updateImage) {
        onSave?.(data.updateImage)
      }
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
            />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconSaveOutlined}
              label={isUpload ? 'Upload' : 'Save'}
              onClick={() => handleSave()}
              disabled={isDisabled}
            />
          }
        />
        {!isLoading && (
          <>
            <PanelSection dark>
              <Box marginBottom={Spacing.Medium}>
                {imageURL && imageWidth && imageHeight && (
                  <FocalPointInput
                    imageURL={imageURL}
                    imageWidth={imageWidth}
                    imageHeight={imageHeight}
                    maxHeight={300}
                    focalPoint={focalPoint}
                    onChange={point => setFocalPoint(point)}
                  />
                )}
              </Box>
              <DescriptionList>
                <DescriptionListItem label="Filename">
                  {filename || 'untitled'}
                  {extension}
                </DescriptionListItem>
                <DescriptionListItem label="Dimension">
                  {imageWidth} x {imageHeight}
                </DescriptionListItem>
                {createdAt && (
                  <DescriptionListItem label="Created">
                    {new Date(createdAt).toLocaleString()}
                  </DescriptionListItem>
                )}
                {updatedAt && (
                  <DescriptionListItem label="Updated">
                    {new Date(updatedAt).toLocaleString()}
                  </DescriptionListItem>
                )}
                <DescriptionListItem label="File Size">{prettyBytes(fileSize)}</DescriptionListItem>

                {originalImageURL && (
                  <DescriptionListItem label="Link">
                    <Link href={originalImageURL} target="_blank">
                      {originalImageURL}
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
                disabled={isDisabled}
                marginBottom={Spacing.Small}
              />
              <TextInput
                label="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={isDisabled}
                marginBottom={Spacing.Small}
              />
              <TextInput
                label="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isDisabled}
                marginBottom={Spacing.Small}
              />

              <TagInput
                label="Tags"
                description="Press enter to add tag"
                value={tags}
                disabled={isDisabled}
                onChange={tags => setTags(tags ?? [])}
              />
            </PanelSection>
            <PanelSectionHeader title="Attribution" />
            <PanelSection>
              <TextInput
                label="Author"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                disabled={isDisabled}
                marginBottom={Spacing.Small}
              />
              <TextInput
                label="Source"
                description="Link to original source of the image."
                value={source}
                onChange={e => setSource(e.target.value)}
                disabled={isDisabled}
                marginBottom={Spacing.Small}
              />
              <TextInput
                label="License"
                value={license}
                onChange={e => setLicense(e.target.value)}
                disabled={isDisabled}
                marginBottom={Spacing.Small}
              />
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
