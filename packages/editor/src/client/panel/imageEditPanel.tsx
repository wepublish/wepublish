import React, {useState, useEffect} from 'react'
import prettyBytes from 'pretty-bytes'

import {
  useUploadImageMutation,
  useUpdateImageMutation,
  useImageQuery,
  ImageRefFragment,
  ImageListDocument
} from '../api'
import {getOperationNameFromDocument} from '../utility'

import {Link} from '../route'

import {useTranslation} from 'react-i18next'
import {FocalPointInput} from '../atoms/focalPointInput'
import {Point} from '../atoms/draggable'
import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Panel,
  TagPicker,
  Notification
} from 'rsuite'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

export interface ImageEditPanelProps {
  readonly id?: string
  readonly file?: File

  onClose?(): void
  onSave?(image: ImageRefFragment): void
}

export function ImagedEditPanel({id, file, onClose, onSave}: ImageEditPanelProps) {
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

  const {t} = useTranslation()

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
        Notification.error({
          title: t('images.panels.notFound'),
          duration: 5000
        })
      }
    }

    return () => {
      /* do nothing */
    }
  }, [file, data])

  useEffect(() => {
    if (loadingError) {
      Notification.error({
        title: loadingError.message,
        duration: 5000
      })
    }
    if (savingError) {
      Notification.error({
        title: savingError.message,
        duration: 5000
      })
    }

    if (uploadError) {
      Notification.error({
        title: uploadError.message,
        duration: 5000
      })
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

      Notification.success({
        title: t('images.panels.imageUpdated'),
        duration: 2000
      })

      if (data?.updateImage) {
        onSave?.(data.updateImage)
      }
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {isUpload ? t('images.panels.uploadImage') : t('images.panels.editImage')}
        </Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        {!isLoading && (
          <>
            <Panel style={{backgroundColor: 'dark'}}>
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
            </Panel>
            <Panel header={t('images.panels.description')}>
              <DescriptionList>
                <DescriptionListItem label={t('images.panels.filename')}>
                  {filename || t('images.panels.untitled')}
                  {extension}
                </DescriptionListItem>
                <DescriptionListItem label={t('images.panels.dimension')}>
                  {t('images.panels.imageDimension', {imageWidth, imageHeight})}
                </DescriptionListItem>
                {createdAt && (
                  <DescriptionListItem label={t('images.panels.created')}>
                    {new Date(createdAt).toLocaleString()}
                  </DescriptionListItem>
                )}
                {updatedAt && (
                  <DescriptionListItem label={t('images.panels.updated')}>
                    {new Date(updatedAt).toLocaleString()}
                  </DescriptionListItem>
                )}
                <DescriptionListItem label={t('images.panels.fileSize')}>
                  {prettyBytes(fileSize)}
                </DescriptionListItem>

                {originalImageURL && (
                  <DescriptionListItem label={t('images.panels.link')}>
                    <Link href={originalImageURL} target="_blank">
                      {originalImageURL}
                    </Link>
                  </DescriptionListItem>
                )}
              </DescriptionList>
            </Panel>
            <Panel header={t('images.panels.information')}>
              <Form fluid={true}>
                <FormGroup>
                  <ControlLabel>{t('images.panels.filename')}</ControlLabel>
                  <FormControl
                    value={filename}
                    disabled={isDisabled}
                    onChange={value => setFilename(value)}
                  />
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('images.panels.title')}</ControlLabel>
                  <FormControl
                    value={title}
                    disabled={isDisabled}
                    onChange={value => setTitle(value)}
                  />
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('images.panels.description')}</ControlLabel>
                  <FormControl
                    value={description}
                    disabled={isDisabled}
                    onChange={value => setDescription(value)}
                  />
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('images.panels.tags')}</ControlLabel>
                  <TagPicker
                    block={true}
                    creatable={true}
                    disabled={isDisabled}
                    value={tags}
                    data={tags.map(tag => ({value: tag, label: tag}))}
                    onChange={value => setTags(value ?? [])}
                  />
                </FormGroup>
              </Form>
            </Panel>
            <Panel header={t('images.panels.attribution')}>
              <Form fluid={true}>
                <FormGroup>
                  <ControlLabel>{t('images.panels.author')}</ControlLabel>
                  <FormControl
                    value={author}
                    disabled={isDisabled}
                    onChange={value => setAuthor(value)}
                  />
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('images.panels.source')}</ControlLabel>
                  <FormControl
                    value={source}
                    disabled={isDisabled}
                    onChange={value => setSource(value)}
                  />
                  <p>{t('images.panels.sourceLink')}</p>
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('images.panels.license')}</ControlLabel>
                  <FormControl
                    value={license}
                    disabled={isDisabled}
                    onChange={value => setLicense(value)}
                  />
                </FormGroup>
              </Form>
            </Panel>
          </>
        )}
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
          {isUpload ? t('images.panels.upload') : t('images.panels.save')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {isUpload ? t('images.panels.cancel') : t('images.panels.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
