import React, {useState} from 'react'

import {useImageListQuery} from '../api'

import {useTranslation} from 'react-i18next'
import {
  Button,
  Panel,
  Icon,
  Input,
  InputGroup,
  Message,
  Loader,
  FlexboxGrid,
  Notification,
  Divider
} from 'rsuite'

import {FileDropInput} from '../atoms/fileDropInput'
import {Typography} from '../atoms/typography'
import {MediaReferenceType, Reference} from '../interfaces/referenceType'
import {ImagedEditComponent} from './imageEditComponent'

export interface ImageSelectPanelProps {
  onClose(): void
  onSelectRef: (ref: Reference) => void
}

const ImagesPerPage = 20

export function RefImageSelectPanel({onClose, onSelectRef}: ImageSelectPanelProps) {
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
      <ImagedEditComponent
        onClose={onClose}
        file={file}
        onSave={image => {
          onSelectRef({contentType: MediaReferenceType, recordId: image.id, record: image})
        }}
      />
    )
  }

  return (
    <>
      <Panel bodyFill={true} style={{height: '150px'}}>
        <FileDropInput
          icon={<Icon icon="upload" />}
          text={t('articleEditor.panels.dropImage')}
          onDrop={handleDrop}
        />
      </Panel>
      <Divider></Divider>

      <h5 className="wep-section-title">{t('articleEditor.panels.images')}</h5>
      <InputGroup style={{margin: '0 0 20px 0'}}>
        <InputGroup.Addon>
          <Icon icon="search" />
        </InputGroup.Addon>
        <Input value={filter} onChange={value => setFilter(value)} />
      </InputGroup>

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
                      onSelectRef({
                        contentType: MediaReferenceType,
                        recordId: image.id,
                        record: image
                      })
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
    </>
  )
}
