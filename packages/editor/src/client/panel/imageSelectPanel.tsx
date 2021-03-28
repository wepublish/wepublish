import React, {useState} from 'react'

import {useImageListQuery, ImageRefFragment} from '../api'
import {ImagedEditPanel} from './imageEditPanel'

import {useTranslation} from 'react-i18next'
import {
  Button,
  Drawer,
  Panel,
  Icon,
  Input,
  InputGroup,
  Message,
  Loader,
  FlexboxGrid,
  Notification
} from 'rsuite'

import {FileDropInput} from '../atoms/fileDropInput'
import {Typography} from '../atoms/typography'
import {MediaReferenceType, Reference} from '../interfaces/referenceType'

export interface ImageSelectPanelProps {
  onClose(): void
  onSelect(image: ImageRefFragment): void
  onSelectRef?: (ref: Reference) => void
}

const ImagesPerPage = 20

export function ImageSelectPanel({onClose, onSelect, onSelectRef}: ImageSelectPanelProps) {
  const [filter, setFilter] = useState('')

  const [file, setFile] = useState<File | null>(null)
  const {data, fetchMore, loading: isLoading} = useImageListQuery({
    fetchPolicy: 'network-only',
    variables: {
      filter: filter,
      first: ImagesPerPage
    }
  })

  const images = data?.images.nodes ?? []

  const {t} = useTranslation()

  async function handleDrop(files: File[]) {
    if (files.length === 0) return

    const file = files[0]

    if (!file.type.startsWith('image')) {
      Notification.error({
        title: t('articleEditor.panels.invalidImage'),
        duration: 5000
      })
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
    return (
      <ImagedEditPanel
        onClose={onClose}
        file={file}
        onSave={image => {
          onSelect(image)
          if (onSelectRef) {
            onSelectRef({contentType: MediaReferenceType, recordId: image.id, record: image})
          }
        }}
      />
    )
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.chooseImage')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel bodyFill={true} style={{height: '150px'}}>
          <FileDropInput
            icon={<Icon icon="upload" />}
            text={t('articleEditor.panels.dropImage')}
            onDrop={handleDrop}
          />
        </Panel>

        <Panel header={t('articleEditor.panels.images')}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
          </InputGroup>
        </Panel>
        {images.length ? (
          <>
            <FlexboxGrid justify="space-around">
              {images.map(image => {
                const {id, mediumURL, title, filename, extension} = image
                return (
                  <FlexboxGrid.Item key={id} colspan={10} style={{marginBottom: 20}}>
                    <Panel
                      style={{cursor: 'pointer'}}
                      onClick={() => {
                        onSelect(image)
                        if (onSelectRef) {
                          onSelectRef({
                            contentType: MediaReferenceType,
                            recordId: image.id,
                            record: image
                          })
                        }
                      }}
                      shaded
                      bordered
                      bodyFill>
                      <div style={{backgroundColor: '#f7f7fa'}}>
                        <img
                          src={mediumURL || ''}
                          style={{
                            display: 'block',
                            margin: '0 auto',
                            maxWidth: '240',
                            maxHeight: '240',
                            width: '100%'
                          }}
                        />
                      </div>
                      <Panel>
                        <Typography variant={'subtitle1'} ellipsize>{`${
                          filename || t('images.panels.untitled')
                        }${extension}`}</Typography>
                        <Typography variant={'body2'}>
                          {title || t('images.panels.Untitled')}
                        </Typography>
                      </Panel>
                    </Panel>
                  </FlexboxGrid.Item>
                )
              })}
            </FlexboxGrid>
            {data?.images.pageInfo.hasNextPage && (
              <Button onClick={loadMore}>{t('articleEditor.panels.loadMore')}</Button>
            )}
          </>
        ) : !isLoading ? (
          <Message type="info" description={t('articleEditor.panels.noImagesFound')} />
        ) : (
          <Loader center content={t('articleEditor.panels.loading')} />
        )}
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
