import SearchIcon from '@rsuite/icons/legacy/Search'
import UploadIcon from '@rsuite/icons/legacy/Upload'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  Button,
  Drawer,
  FlexboxGrid,
  Form,
  Input,
  InputGroup,
  Loader,
  Message,
  Notification,
  Panel,
  toaster
} from 'rsuite'
import {ImageRefFragment, useImageListQuery} from '../api'
import {FileDropInput} from '../atoms/fileDropInput'
import {Typography} from '../atoms/typography'
import {getImgMinSizeToCompress} from '../utility'
import {ImagedEditPanel} from './imageEditPanel'

export interface ImageSelectPanelProps {
  onClose(): void
  onSelect(image: ImageRefFragment): void
}

const ImagesPerPage = 20

export function ImageSelectPanel({onClose, onSelect}: ImageSelectPanelProps) {
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
      toaster.push(
        <Notification
          type="error"
          header={t('articleEditor.panels.invalidImage')}
          duration={5000}
        />,
        {placement: 'topEnd'}
      )

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
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.chooseImage')}</Drawer.Title>

        <Drawer.Actions>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('articleEditor.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Panel bodyFill style={{height: '150px'}}>
          <FileDropInput
            icon={<UploadIcon />}
            text={t('articleEditor.panels.dropImage')}
            onDrop={handleDrop}
          />
        </Panel>
        <Form.ControlLabel>
          <br />
          {t('images.panels.resizedImage', {sizeMB: getImgMinSizeToCompress()})}
        </Form.ControlLabel>

        <Panel header={t('articleEditor.panels.images')}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <SearchIcon />
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
                      onClick={() => onSelect(image)}
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
          <Message type="info">{t('articleEditor.panels.noImagesFound')}</Message>
        ) : (
          <Loader center content={t('articleEditor.panels.loading')} />
        )}
      </Drawer.Body>
    </>
  )
}
