import React, {useState, useEffect} from 'react'

import {ImagedEditPanel} from '../panel/imageEditPanel'

import {
  ImageUploadRoute,
  useRoute,
  RouteType,
  ImageListRoute,
  useRouteDispatch,
  Link,
  ImageEditRoute,
  ButtonLink
} from '../route'

import {RouteActionType} from '@karma.run/react'
import {ImageUploadAndEditPanel} from '../panel/imageUploadAndEditPanel'
import {
  useImageListQuery,
  useDeleteImageMutation,
  ImageRefFragment,
  ImageListQuery,
  ImageListDocument,
  FullImageFragment
} from '../api'

import {useTranslation} from 'react-i18next'
import {
  FlexboxGrid,
  Icon,
  Input,
  InputGroup,
  Panel,
  IconButton,
  Drawer,
  Modal,
  Button
} from 'rsuite'
import {Overlay} from '../atoms/overlay'
import {Typography} from '../atoms/typography'

const ImagesPerPage = 24

export function ImageList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isUploadModalOpen, setUploadModalOpen] = useState(current?.type === RouteType.ImageUpload)
  const [isEditModalOpen, setEditModalOpen] = useState(current?.type === RouteType.ImageEdit)

  const [editID, setEditID] = useState<string | null>(
    current?.type === RouteType.ImageEdit ? current.params.id : null
  )
  const [images, setImages] = useState<FullImageFragment[]>([])

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState<ImageRefFragment>()

  const listVariables = {filter: filter || undefined, first: ImagesPerPage}
  const {data, /* fetchMore, */ loading: isLoading} = useImageListQuery({
    fetchPolicy: 'network-only',
    variables: listVariables
  })

  const [deleteImage, {loading: isDeleting}] = useDeleteImageMutation()

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.images?.nodes) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setImages(data.images.nodes)
    }
  }, [data?.images])

  useEffect(() => {
    if (current?.type === RouteType.ImageUpload) {
      setUploadModalOpen(true)
    }

    if (current?.type === RouteType.ImageEdit) {
      setEditModalOpen(true)
      setEditID(current.params.id)
    }
  }, [current])

  /* function loadMore() {
    fetchMore({
      variables: {first: ImagesPerPage, after: data?.images.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          images: {
            ...fetchMoreResult.images,
            nodes: [...prev.images.nodes, ...fetchMoreResult?.images.nodes]
          }
        }
      }
    })
  } */

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('images.overview.imageLibrary')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink appearance="primary" disabled={isLoading} route={ImageUploadRoute.create({})}>
            {t('images.overview.uploadImage')}
          </ButtonLink>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      {images.length > 0 ? (
        <FlexboxGrid justify="space-around" style={{marginTop: '20px'}}>
          {images.map((image, key) => (
            <FlexboxGrid.Item colspan={7} style={{marginBottom: '20px'}} key={key}>
              <Link route={ImageEditRoute.create({id: image.id}, current ?? undefined)}>
                <Panel shaded bordered bodyFill>
                  <img src={image.thumbURL || ''} />
                  <Overlay bottom={0} width="100%" maxHeight="50%" padding={10}>
                    <Typography variant="subtitle1" color="gray" ellipsize>
                      {`${image.filename || t('images.panels.untitled')}${image.extension}`}
                    </Typography>
                    <Typography variant="body2" color="white" ellipsize>
                      {image.title || t('images.panels.Untitled')}
                    </Typography>
                  </Overlay>
                  <IconButton
                    style={{position: 'absolute', top: '5px', right: '5px'}}
                    icon={<Icon icon="trash" />}
                    circle
                    size="sm"
                    onClick={event => {
                      event.preventDefault()
                      setCurrentImage(image)
                      setConfirmationDialogOpen(true)
                    }}
                  />
                </Panel>
              </Link>
            </FlexboxGrid.Item>
          ))}
        </FlexboxGrid>
      ) : (
        <p>{t('images.overview.noImagesFound')}</p>
      )}

      <Drawer
        show={isUploadModalOpen}
        size={'sm'}
        onHide={() => {
          setUploadModalOpen(false)
          dispatch({
            type: RouteActionType.PushRoute,
            route: ImageListRoute.create({}, current ?? undefined)
          })
        }}>
        <ImageUploadAndEditPanel
          onClose={() => {
            setUploadModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: ImageListRoute.create({}, current ?? undefined)
            })
          }}
          onUpload={() => {
            setUploadModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: ImageListRoute.create({}, current ?? undefined)
            })
          }}
        />
      </Drawer>
      <Drawer
        show={isEditModalOpen}
        size={'sm'}
        onHide={() => {
          setEditModalOpen(false)
          dispatch({
            type: RouteActionType.PushRoute,
            route: ImageListRoute.create({}, current ?? undefined)
          })
        }}>
        <ImagedEditPanel
          id={editID!}
          onClose={() => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: ImageListRoute.create({}, current ?? undefined)
            })
          }}
        />
      </Drawer>
      <Modal show={isConfirmationDialogOpen} onHide={() => setConfirmationDialogOpen(false)}>
        <Modal.Title>{t('images.panels.deleteImage')}</Modal.Title>

        <Modal.Body>
          <p>
            {`${currentImage?.filename || t('images.panels.untitled')}${currentImage?.extension}` ||
              '-'}
          </p>
          <p>{currentImage?.title || t('images.panels.untitled')}</p>
          <p>{currentImage?.description || '-'}</p>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentImage) return

              await deleteImage({
                variables: {id: currentImage.id},
                update: cache => {
                  const query = cache.readQuery<ImageListQuery>({
                    query: ImageListDocument,
                    variables: listVariables
                  })

                  if (!query) return

                  cache.writeQuery<ImageListQuery>({
                    query: ImageListDocument,
                    data: {
                      images: {
                        ...query.images,
                        nodes: query.images.nodes.filter(article => article.id !== currentImage.id)
                      }
                    },
                    variables: listVariables
                  })
                }
              })
            }}
            color="red">
            {t('images.panels.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('images.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
