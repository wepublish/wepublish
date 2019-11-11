import React, {useState, useEffect} from 'react'

import {Typography, Box, Spacing, Grid, Column, Drawer, Image, Card, Divider} from '@karma.run/ui'
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
import {useImageListQuery} from '../api/imageListQuery'

export function ImageList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isUploadModalOpen, setUploadModalOpen] = useState(current?.type === RouteType.ImageUpload)
  const [isEditModalOpen, setEditModalOpen] = useState(current?.type === RouteType.ImageEdit)

  const [editID, setEditID] = useState<string | null>(
    current?.type === RouteType.ImageEdit ? current.params.id : null
  )

  const after = current?.query?.after
  const before = current?.query?.before

  const {data, refetch} = useImageListQuery({
    after,
    before,
    pageLimit: 12,
    transformations: [{width: 300, height: 200}]
  })

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
      <Box flexDirection="row" marginBottom={Spacing.Medium} flex>
        <Typography variant="h1">Image Library</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          label="Upload Image"
          color="primary"
          route={ImageUploadRoute.create({}, current ?? undefined)}
        />
      </Box>
      <Box>
        <Grid spacing={Spacing.Small}>
          {images.map(({id, transform: [url]}) => (
            <Column key={id} ratio={1 / 3}>
              <Box height={200}>
                <Link route={ImageEditRoute.create({id}, current ?? undefined)}>
                  <Card>
                    <Image src={url} />
                  </Card>
                </Link>
              </Box>
            </Column>
          ))}
          {missingColumns.map((value, index) => (
            <Column key={index} ratio={1 / 3}>
              <Box height={200}>
                <Card />
              </Box>
            </Column>
          ))}
        </Grid>
      </Box>
      <Box paddingTop={Spacing.Medium} paddingBottom={Spacing.Medium}>
        <Divider />
      </Box>
      <Box flexDirection="row" flex>
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
            onUpload={() => refetch()}
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
    </>
  )
}
