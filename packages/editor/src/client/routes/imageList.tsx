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
  IconButton
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
import {useImageListQuery, ImageRefData, useDeleteImageMutation} from '../api/image'
import {MaterialIconDeleteOutlined, MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'

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
  const [currentImage, setCurrentImage] = useState<ImageRefData>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const after = current?.query?.after
  const before = current?.query?.before

  const {data, refetch, loading: isLoading} = useImageListQuery({
    fetchPolicy: 'network-only',
    variables: {
      filter: filter || undefined,
      after,
      before,
      first: before ? undefined : ImagesPerPage,
      last: before ? ImagesPerPage : undefined
    }
  })

  const [deleteImage, {loading: isDeleting}] = useDeleteImageMutation()

  const images = data?.images.nodes ?? []
  const {startCursor, endCursor, hasPreviousPage, hasNextPage} = data?.images.pageInfo ?? {}

  const missingColumns =
    images.length % 3 !== 0 ? new Array(3 - (images.length % 3)).fill(null) : []

  useEffect(() => {
    if (current?.type === RouteType.ImageUpload) {
      setUploadModalOpen(true)
    }

    if (current?.type === RouteType.ImageEdit) {
      setEditModalOpen(true)
      setEditID(current.params.id)
    }
  }, [current])

  return (
    <>
      <Box flexDirection="row" marginBottom={Spacing.Small} display="flex">
        <Typography variant="h1">Image Library</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          label="Upload Image"
          color="primary"
          route={ImageUploadRoute.create({}, current ?? undefined)}
        />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder="Search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {images.length ? (
          <Grid spacing={Spacing.Small}>
            {images.map(image => {
              const {id, thumbURL} = image

              return (
                <Column key={id} ratio={1 / 3}>
                  <Box position="relative" height={200} flexGrow={1}>
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
                    <Card overflow="hidden" width="100%" height="100%">
                      <Link route={ImageEditRoute.create({id}, current ?? undefined)}>
                        <Image src={thumbURL} width="100%" height="100%" />
                      </Link>
                    </Card>
                  </Box>
                </Column>
              )
            })}
            {missingColumns.map((value, index) => (
              <Column key={index} ratio={1 / 3}></Column>
            ))}
          </Grid>
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            No Images found
          </Typography>
        ) : null}
      </Box>
      <Box marginTop={Spacing.Medium} flexDirection="row" display="flex">
        <RouteLinkButton
          variant="outlined"
          label="Previous"
          route={
            hasPreviousPage ? ImageListRoute.create({}, {query: {before: startCursor!}}) : undefined
          }
          disabled={!hasPreviousPage}
        />
        <Box flexGrow={1} />
        <RouteLinkButton
          variant="outlined"
          label="Next"
          route={hasNextPage ? ImageListRoute.create({}, {query: {after: endCursor!}}) : undefined}
          disabled={!hasNextPage}
        />
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
              refetch()
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
              refetch()
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
              title="Delete Image?"
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label="Cancel"
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label="Confirm"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!currentImage) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
                        await deleteImage({
                          variables: {id: currentImage.id}
                        })
                        break
                    }

                    setConfirmationDialogOpen(false)
                    refetch()
                  }}
                />
              }
            />
            <PanelSection>
              <DescriptionList>
                <DescriptionListItem label="Filename">
                  {`${currentImage?.filename || 'untitled'}${currentImage?.extension}` || '-'}
                </DescriptionListItem>
                <DescriptionListItem label="Title">
                  {currentImage?.title || 'Untitled'}
                </DescriptionListItem>
                <DescriptionListItem label="Description">
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
