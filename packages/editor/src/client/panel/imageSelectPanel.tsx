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

import {useTranslation} from 'react-i18next'

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

  const {t} = useTranslation()

  async function handleDrop(files: File[]) {
    if (files.length === 0) return

    const file = files[0]

    if (!file.type.startsWith('image')) {
      setErrorToastOpen(true)
      setErrorMessage(t('articleEditor.panels.invalidImage'))
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
          title={t('articleEditor.panels.chooseImage')}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('articleEditor.panels.close')}
              onClick={() => onClose()}
            />
          }
        />
        <PanelSection>
          <Box height={100}>
            <FileDropInput
              icon={MaterialIconCloudUploadOutlined}
              text={t('articleEditor.panels.dropImage')}
              onDrop={handleDrop}
            />
          </Box>
        </PanelSection>
        <PanelSectionHeader title={t('articleEditor.panels.images')} />
        <PanelSection>
          <Box marginBottom={Spacing.Small}>
            <SearchInput
              placeholder={t('articleEditor.panels.search')}
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
                              {`${filename || t('articleEditor.panels.untitled')}${extension}`}
                            </Typography>
                            <Typography variant="body2" color="white" ellipsize>
                              {title || t('articleEditor.panels.untitled')}
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
                  <Button label={t('articleEditor.loadMore')} onClick={loadMore} />
                )}
              </Box>
            </>
          ) : !isLoading ? (
            <Typography variant="body1" color="gray" align="center">
              {t('articleEditor.panels.noImagesFound')}
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
