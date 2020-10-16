import React, {useState, useEffect} from 'react'

import {
  Typography,
  Box,
  Spacing,
  Grid,
  Column,
  Drawer,
  Image,
  Card,
  SearchInput,
  Dialog,
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  DescriptionList,
  DescriptionListItem,
  ZIndex,
  IconButton,
  Overlay,
  Button
} from '@karma.run/ui'

import {ImagedEditPanel} from '../panel/imageEditPanel'

import {
  ImageUploadRoute,
  RouteLinkButton,
  useRoute,
  RouteType,
  ImageListRoute,
  useRouteDispatch,
  Link,
  ImageEditRoute
} from '../route'

import {RouteActionType} from '@karma.run/react'
import {ImageUploadAndEditPanel} from '../panel/imageUploadAndEditPanel'
import {
  useImageListQuery,
  useDeleteImageMutation,
  ImageRefFragment,
  ImageListQuery,
  ImageListDocument
} from '../api'
import {MaterialIconDeleteOutlined, MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'

import {useTranslation} from 'react-i18next'

enum ConfirmAction {
  Delete = 'delete'
}

const ImagesPerPage = 24

export function ImageList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isUploadModalOpen, setUploadModalOpen] = useState(current?.type === RouteType.ImageUpload)
  const [isEditModalOpen, setEditModalOpen] = useState(current?.type === RouteType.ImageEdit)

  const [editID, setEditID] = useState<string | null>(
    current?.type === RouteType.ImageEdit ? current.params.id : null
  )

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState<ImageRefFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const listVariables = {filter: filter || undefined, first: ImagesPerPage}
  const {data, fetchMore, loading: isLoading} = useImageListQuery({
    fetchPolicy: 'network-only',
    variables: listVariables
  })

  const [deleteImage, {loading: isDeleting}] = useDeleteImageMutation()

  const images = data?.images.nodes ?? []

  const missingColumns =
    images.length % 3 !== 0 ? new Array(3 - (images.length % 3)).fill(null) : []

  const {t} = useTranslation()

  useEffect(() => {
    if (current?.type === RouteType.ImageUpload) {
      setUploadModalOpen(true)
    }

    if (current?.type === RouteType.ImageEdit) {
      setEditModalOpen(true)
      setEditID(current.params.id)
    }
  }, [current])

  function loadMore() {
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
  }

  return (
    <>
      <Box flexDirection="row" marginBottom={Spacing.Small} display="flex">
        <Typography variant="h1">{t('images.overview.imageLibrary')}</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          label={t('images.overview.uploadImage')}
          color="primary"
          route={ImageUploadRoute.create({}, current ?? undefined)}
        />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder={t('images.overview.search')}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {images.length ? (
          <>
            <Box marginBottom={Spacing.Small}>
              <Grid spacing={Spacing.Small}>
                {images.map(image => {
                  const {id, thumbURL, title, filename, extension} = image

                  return (
                    <Column key={id} ratio={1 / 3}>
                      <Card
                        position="relative"
                        overflow="hidden"
                        width="100%"
                        height={200}
                        flexGrow={1}>
                        <Box
                          position="absolute"
                          zIndex={ZIndex.Default}
                          right={0}
                          top={0}
                          padding={Spacing.ExtraSmall}>
                          <IconButton
                            icon={MaterialIconDeleteOutlined}
                            onClick={item => {
                              setCurrentImage(image)
                              setConfirmationDialogOpen(true)
                              setConfirmAction(ConfirmAction.Delete)
                            }}
                          />
                        </Box>
                        <Link route={ImageEditRoute.create({id}, current ?? undefined)}>
                          {thumbURL && <Image src={thumbURL} width="100%" height="100%" />}

                          <Overlay
                            bottom={0}
                            width="100%"
                            maxHeight="50%"
                            padding={Spacing.ExtraSmall}>
                            <Typography variant="subtitle1" color="gray" ellipsize>
                              {`${filename || t('images.panels.untitled')}${extension}`}
                            </Typography>
                            <Typography variant="body2" color="white" ellipsize>
                              {title || t('images.panels.Untitled')}
                            </Typography>
                          </Overlay>
                        </Link>
                      </Card>
                    </Column>
                  )
                })}
                {missingColumns.map((value, index) => (
                  <Column key={index} ratio={1 / 3}></Column>
                ))}
              </Grid>
            </Box>
            <Box display="flex" justifyContent="center">
              {data?.images.pageInfo.hasNextPage && (
                <Button label={t('images.overview.loadMore')} onClick={loadMore} />
              )}
            </Box>
          </>
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            {t('images.overview.noImagesFound')}
          </Typography>
        ) : null}
      </Box>
      <Drawer open={isUploadModalOpen} width={480}>
        {() => (
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
        )}
      </Drawer>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
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
        )}
      </Drawer>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title={t('images.panels.deleteImage')}
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label={t('images.panels.cancel')}
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label={t('images.panels.confirm')}
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!currentImage) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
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
                                  nodes: query.images.nodes.filter(
                                    article => article.id !== currentImage.id
                                  )
                                }
                              },
                              variables: listVariables
                            })
                          }
                        })
                        break
                    }

                    setConfirmationDialogOpen(false)
                  }}
                />
              }
            />
            <PanelSection>
              <DescriptionList>
                <DescriptionListItem label={t('images.panels.filename')}>
                  {`${currentImage?.filename || t('images.panels.untitled')}${
                    currentImage?.extension
                  }` || '-'}
                </DescriptionListItem>
                <DescriptionListItem label={t('images.panels.title')}>
                  {currentImage?.title || t('images.panels.untitled')}
                </DescriptionListItem>
                <DescriptionListItem label={t('images.panels.description')}>
                  {currentImage?.description || '-'}
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
