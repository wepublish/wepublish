import React, {useState} from 'react'
import {MaterialIconClose, MaterialIconCloudUploadOutlined} from '@karma.run/icons'

import {
  Box,
  FileDropInput,
  NavigationButton,
  Panel,
  PanelHeader,
  PanelSection,
  Toast,
  Grid,
  Column,
  Card,
  Spacing,
  Image,
  Button,
  Overlay,
  Typography,
  SearchInput,
  PanelSectionHeader
} from '@karma.run/ui'

import {useImageListQuery, ImageRefFragment} from '../api'
import {ImagedEditPanel} from './imageEditPanel'

export interface ImageSelectPanelProps {
  onClose(): void
  onSelect(image: ImageRefFragment): void
}

const ImagesPerPage = 20

export function ImageSelectPanel({onClose, onSelect}: ImageSelectPanelProps) {
  const [filter, setFilter] = useState('')

  const [errorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const {data, fetchMore, loading: isLoading} = useImageListQuery({
    fetchPolicy: 'network-only',
    variables: {
      filter: filter,
      first: ImagesPerPage
    }
  })

  const images = data?.images.nodes ?? []
  const missingColumns =
    images.length % 2 !== 0 ? new Array(2 - (images.length % 2)).fill(null) : []

  async function handleDrop(files: File[]) {
    if (files.length === 0) return

    const file = files[0]

    if (!file.type.startsWith('image')) {
      setErrorToastOpen(true)
      setErrorMessage('Invalid Image')
      return
    }

    setFile(file)
  }

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

  if (file) {
    return <ImagedEditPanel onClose={onClose} file={file} onSave={image => onSelect(image)} />
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title="Choose Image"
          leftChildren={
            <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose()} />
          }
        />
        <PanelSection>
          <Box height={100}>
            <FileDropInput
              icon={MaterialIconCloudUploadOutlined}
              text="Drop Image Here"
              onDrop={handleDrop}
            />
          </Box>
        </PanelSection>
        <PanelSectionHeader title="Images" />
        <PanelSection>
          <Box marginBottom={Spacing.Small}>
            <SearchInput
              placeholder="Search"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </Box>
          {images.length ? (
            <>
              <Box marginBottom={Spacing.Small}>
                <Grid>
                  {images.map(image => {
                    const {id, thumbURL, title, filename, extension} = image

                    return (
                      <Column key={id} ratio={1 / 2}>
                        <Card
                          onClick={() => onSelect(image)}
                          position="relative"
                          overflow="hidden"
                          width="100%"
                          height={150}
                          flexGrow={1}
                          style={{cursor: 'pointer'}}>
                          {thumbURL && <Image src={thumbURL} width="100%" height="100%" />}

                          <Overlay
                            bottom={0}
                            width="100%"
                            maxHeight="50%"
                            padding={Spacing.ExtraSmall}>
                            <Typography variant="subtitle1" color="gray" ellipsize>
                              {`${filename || 'untitled'}${extension}`}
                            </Typography>
                            <Typography variant="body2" color="white" ellipsize>
                              {title || 'Untitled'}
                            </Typography>
                          </Overlay>
                        </Card>
                      </Column>
                    )
                  })}
                  {missingColumns.map((value, index) => (
                    <Column key={index} ratio={1 / 2} />
                  ))}
                </Grid>
              </Box>
              <Box display="flex" justifyContent="center">
                {data?.images.pageInfo.hasNextPage && (
                  <Button label="Load More" onClick={loadMore} />
                )}
              </Box>
            </>
          ) : !isLoading ? (
            <Typography variant="body1" color="gray" align="center">
              No Images found
            </Typography>
          ) : null}
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
