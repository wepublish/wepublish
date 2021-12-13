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

import {RouteActionType} from '@wepublish/karma.run-react'
import {ImageUploadAndEditPanel} from '../panel/imageUploadAndEditPanel'
import {
  useImageListQuery,
  useDeleteImageMutation,
  ImageRefFragment,
  ImageListQuery,
  ImageListDocument,
  FullImageFragment
} from '../api'

import {IconButtonTooltip} from '../atoms/iconButtonTooltip'

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
  Button,
  Pagination
  // Row
} from 'rsuite'
import {Overlay} from '../atoms/overlay'
import {Typography} from '../atoms/typography'
// import { DEFAULT_TABLE_PAGE_SIZES } from '../utility'

// const ImagesPerPage = 24

export function ImageList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()
  const [images, setImages] = useState<FullImageFragment[]>([])

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState<ImageRefFragment>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(3)

  const [isUploadModalOpen, setUploadModalOpen] = useState(current?.type === RouteType.ImageUpload)
  const [isEditModalOpen, setEditModalOpen] = useState(current?.type === RouteType.ImageEdit)

  const [editID, setEditID] = useState<string | null>(
    current?.type === RouteType.ImageEdit ? current.params.id : null
  )

  const listVariables = {
    filter: filter || undefined,
    first: limit,
    // // check if skip is everywhere it's needed
    skip: page - 1
  }

  const {data, refetch, /* fetchMore, */ loading: isLoading} = useImageListQuery({
    fetchPolicy: 'network-only',
    variables: listVariables
  })

  const [deleteImage, {loading: isDeleting}] = useDeleteImageMutation()

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.images?.nodes) {
      setImages(data.images.nodes as React.SetStateAction<FullImageFragment[]>)
    }
  }, [data?.images])

  //fetch images when parameters change
  useEffect(() => {
    refetch(listVariables)
  }, [filter, page, limit])

  useEffect(() => {
    if (current?.type === RouteType.ImageUpload) {
      setUploadModalOpen(true)
    }

    if (current?.type === RouteType.ImageEdit) {
      setEditModalOpen(true)
      setEditID(current.params.id)
    }
  }, [current])
  console.log('totel nr of images', data?.images.totalCount)
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

  // const imageData = images.filter((v, i) => {
  //   const start = limit * (page - 1);
  //   const end = start + limit;
  //   console.log('imgnbr', images, 'start,', start, 'end', end)
  //   return i >= start && i < end;
  // });

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
        <div>
          <FlexboxGrid justify="space-around" style={{marginTop: '20px'}}>
            {images.map((image, key) => (
              <FlexboxGrid.Item
                colspan={7}
                style={{marginBottom: '20px', maxWidth: '300'}}
                key={key}>
                <Link route={ImageEditRoute.create({id: image.id}, current ?? undefined)}>
                  <Panel
                    shaded
                    bordered
                    bodyFill
                    style={{height: '200', width: 'calc(100% + 2px)'}}>
                    <img
                      src={image.mediumURL || ''}
                      style={{height: '200', display: 'block', margin: '0 auto'}}
                    />
                    <Overlay
                      style={{
                        bottom: '0px',
                        width: '100%',
                        maxHeight: '60%',
                        padding: '10px'
                      }}>
                      <Typography variant="subtitle1" color="gray" ellipsize>
                        {`${image.filename || t('images.panels.untitled')}${image.extension}`}
                      </Typography>
                      <Typography variant="body2" color="white" ellipsize>
                        {image.title || t('images.panels.Untitled')}
                      </Typography>
                      <Typography className="displayThreeLinesOnly">{image.description}</Typography>
                    </Overlay>
                    <IconButtonTooltip caption={t('images.overview.delete')}>
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
                    </IconButtonTooltip>
                  </Panel>
                </Link>
              </FlexboxGrid.Item>
            ))}
          </FlexboxGrid>

          <Pagination
            showInfo={true}
            total={data?.images.totalCount}
            prev
            next
            first
            last
            {...console.log(images.length)}
            //  limitOptions={[3, 20]}
            limit={setLimit}
            activePage={page}
            //  onChangePage={setPage}
            page={setPage}
            //  onChangeLimit={setLimit}
          />
        </div>
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
              setConfirmationDialogOpen(false)
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
