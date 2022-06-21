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
  Input,
  InputGroup,
  IconButton,
  Drawer,
  Modal,
  Button,
  Table,
  Pagination
} from 'rsuite'

import {DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_IMAGE_PAGE_SIZES} from '../utility'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import SearchIcon from '@rsuite/icons/legacy/Search'
import EditIcon from '@rsuite/icons/legacy/Edit'

const {Column, HeaderCell, Cell} = Table

export function ImageList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()
  const [images, setImages] = useState<FullImageFragment[]>([])

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState<ImageRefFragment>()

  const [activePage, setActivePage] = useState(1)
  const [limit, setLimit] = useState(5)

  const [isUploadModalOpen, setUploadModalOpen] = useState(current?.type === RouteType.ImageUpload)
  const [isEditModalOpen, setEditModalOpen] = useState(current?.type === RouteType.ImageEdit)

  const [editID, setEditID] = useState<string | null>(
    current?.type === RouteType.ImageEdit ? current.params.id : null
  )

  const listVariables = {
    filter: filter || undefined,
    first: limit,
    skip: activePage - 1
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

  useEffect(() => {
    refetch(listVariables)
  }, [filter, activePage, limit])

  useEffect(() => {
    if (current?.type === RouteType.ImageUpload) {
      setUploadModalOpen(true)
    }

    if (current?.type === RouteType.ImageEdit) {
      setEditModalOpen(true)
      setEditID(current.params.id)
    }
  }, [current])

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
              <SearchIcon />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>
      <div>
        <Table
          minHeight={600}
          data={images}
          rowHeight={100}
          autoHeight
          loading={isLoading}
          wordWrap
          className={'displayThreeLinesOnly'}>
          <Column width={160} align="left" resizable>
            <HeaderCell>{t('images.overview.image')}</HeaderCell>
            <Cell>
              {(rowData: ImageRefFragment) => (
                <Link route={ImageEditRoute.create({id: rowData.id}, current ?? undefined)}>
                  <img
                    src={rowData.thumbURL || ''}
                    style={{height: '70', width: 'auto', display: 'block', margin: '0 auto'}}
                  />
                </Link>
              )}
            </Cell>
          </Column>
          <Column width={160} align="left" resizable>
            <HeaderCell>{t('images.overview.title')}</HeaderCell>
            <Cell className="displayThreeLinesOnly">
              {(rowData: ImageRefFragment) => (
                <p className={'displayThreeLinesOnly'}>
                  {rowData.title ? rowData.title : t('images.overview.untitled')}
                </p>
              )}
            </Cell>
          </Column>
          <Column width={340} align="left" resizable>
            <HeaderCell>{t('images.overview.description')}</HeaderCell>
            <Cell className={'displayThreeLinesOnly'}>
              {(rowData: ImageRefFragment) => (
                <p className={'displayThreeLinesOnly'}>
                  {rowData.description ? rowData.description : t('images.overview.noDescription')}
                </p>
              )}
            </Cell>
          </Column>

          <Column width={250} align="left" resizable>
            <HeaderCell>{t('images.overview.filename')}</HeaderCell>
            <Cell>
              {(rowData: ImageRefFragment) => (
                <p className={'displayThreeLinesOnly'}>
                  {rowData.filename ? rowData.filename : ''}
                </p>
              )}
            </Cell>
          </Column>

          <Column width={160} align="center" resizable>
            <HeaderCell>{t('images.overview.actions')}</HeaderCell>
            <Cell style={{padding: '6px 0'}}>
              {(rowData: ImageRefFragment) => (
                <>
                  <IconButtonTooltip caption={t('images.overview.edit')}>
                    <>
                      {/* Empty div is used here as Link is a function component without forwardRef and  IconButtonTooltip is passing down a ref */}

                      <Link route={ImageEditRoute.create({id: rowData.id}, current ?? undefined)}>
                        <IconButton
                          icon={<EditIcon />}
                          circle
                          size="sm"
                          style={{marginLeft: '5px'}}
                        />
                      </Link>
                    </>
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('images.overview.delete')}>
                    <IconButton
                      icon={<TrashIcon />}
                      circle
                      size="sm"
                      style={{marginLeft: '5px'}}
                      onClick={event => {
                        event.preventDefault()
                        setCurrentImage(rowData)
                        setConfirmationDialogOpen(true)
                      }}
                    />
                  </IconButtonTooltip>
                </>
              )}
            </Cell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_IMAGE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.images.totalCount ?? 0}
          activePage={activePage}
          onChangePage={page => setActivePage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </div>

      <Drawer
        open={isUploadModalOpen}
        size={'sm'}
        onClose={() => {
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
        open={isEditModalOpen}
        size={'sm'}
        onClose={() => {
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
      <Modal open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
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
