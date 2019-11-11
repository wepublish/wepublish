import React, {useState, useEffect} from 'react'

import {
  Typography,
  Box,
  Spacing,
  Grid,
  Column,
  Drawer,
  Panel,
  PanelHeader,
  PanelSection,
  FileDropInput,
  Toast,
  Image,
  NavigationButton,
  Card,
  Divider
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconCloudUploadOutlined} from '@karma.run/icons'
import {useMutation, useQuery} from '@apollo/react-hooks'

import gql from 'graphql-tag'

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

const ImagesQuery = gql`
  query($after: ID, $before: ID, $first: Int, $last: Int) {
    images(after: $after, before: $before, first: $first, last: $last) {
      nodes {
        id
        transform(transformations: [{width: 300, height: 200}])
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

interface ListImage {
  readonly id: string
  readonly transform: string[]
}

interface PageInfo {
  startCursor?: string
  endCursor?: string
  hasNextPage: boolean
  hasPreviousPage: boolean
}

const pageLimit = 12

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

  const {data, refetch} = useQuery(ImagesQuery, {
    fetchPolicy: 'network-only',
    variables: {
      after,
      before,
      first: before ? undefined : pageLimit,
      last: before ? pageLimit : undefined
    }
  })

  const images: ListImage[] = data?.images?.nodes ?? []
  const {startCursor, endCursor, hasNextPage, hasPreviousPage}: PageInfo =
    data?.images?.pageInfo ?? {}

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

const UploadMutation = gql`
  mutation($images: [Upload!]!) {
    uploadImages(images: $images) {
      id
    }
  }
`
export interface ImageUploadAndEditPanelProps {
  onClose(): void
  onUpload(ids: string[]): void
}

export function ImageUploadAndEditPanel({onClose, onUpload}: ImageUploadAndEditPanelProps) {
  const [id, setID] = useState<string | null>(null)

  function handleUpload(ids: string[]) {
    setID(ids[0])
    onUpload(ids)
  }

  return id ? (
    <ImagedEditPanel id={id} onClose={onClose} />
  ) : (
    <ImageUploadPanel onClose={onClose} onUpload={handleUpload} />
  )
}

export interface ImageUploadPanelProps {
  onClose(): void
  onUpload(imageIDs: string[]): void
}

export function ImageUploadPanel({onClose, onUpload}: ImageUploadPanelProps) {
  const [errorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [upload, {loading, error}] = useMutation(UploadMutation)

  async function handleDrop(files: File[]) {
    if (files.length === 0) return

    const file = files[0]

    if (!file.type.startsWith('image')) {
      setErrorToastOpen(true)
      setErrorMessage('Invalid Image')
      return
    }

    const response = await upload({variables: {images: [file]}})
    const uploadedImages = response.data.uploadImages.map(({id}: {id: string}) => id)

    onUpload(uploadedImages)
  }

  useEffect(() => {
    if (error) {
      setErrorToastOpen(true)
      setErrorMessage(error.message)
    }
  }, [error])

  return (
    <>
      <Panel>
        <PanelHeader
          title="Upload Image"
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label="Close"
              onClick={() => onClose()}
              disabled={loading}
            />
          }
        />
        <PanelSection>
          <Box height={100}>
            <FileDropInput
              icon={MaterialIconCloudUploadOutlined}
              text="Drop Image Here"
              onDrop={handleDrop}
              disabled={loading}
            />
          </Box>
        </PanelSection>
      </Panel>
      <Toast
        type="error"
        open={errorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
