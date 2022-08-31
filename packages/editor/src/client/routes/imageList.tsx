import EditIcon from '@rsuite/icons/legacy/Edit'
import SearchIcon from '@rsuite/icons/legacy/Search'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {
  Button,
  Drawer,
  FlexboxGrid,
  IconButton,
  Input,
  InputGroup,
  Modal,
  Pagination,
  Table
} from 'rsuite'

import {
  FullImageFragment,
  ImageListDocument,
  ImageListQuery,
  ImageRefFragment,
  useDeleteImageMutation,
  useImageListQuery
} from '../api'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {ImageEditPanel} from '../panel/imageEditPanel'
import {ImageUploadAndEditPanel} from '../panel/imageUploadAndEditPanel'
import {DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_IMAGE_PAGE_SIZES} from '../utility'
import {createCheckedPermissionComponent, PermissionControl} from '../atoms/permissionControl'

const {Column, HeaderCell, Cell} = Table

function ImageList() {
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const {id} = params

  const isUploadRoute = location.pathname.includes('upload')
  const isEditRoute = location.pathname.includes('edit')

  const [images, setImages] = useState<FullImageFragment[]>([])

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState<ImageRefFragment>()

  const [activePage, setActivePage] = useState(1)
  const [limit, setLimit] = useState(5)

  const [isUploadModalOpen, setUploadModalOpen] = useState(isUploadRoute)
  const [isEditModalOpen, setEditModalOpen] = useState(isEditRoute)

  const [editID, setEditID] = useState<string | undefined>(isEditRoute ? id : undefined)

  const listVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (activePage - 1) * limit
  }

  const {data, refetch, loading: isLoading} = useImageListQuery({
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
    if (isUploadRoute) {
      setUploadModalOpen(true)
    }

    if (isEditRoute) {
      setEditModalOpen(true)
      setEditID(id)
    }
  }, [location])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('images.overview.imageLibrary')}</h2>
        </FlexboxGrid.Item>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_IMAGE']}>
          <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
            <Link to="/images/upload" state={{modalLocation: location}}>
              <Button appearance="primary" disabled={isLoading}>
                {t('images.overview.uploadImage')}
              </Button>
            </Link>
          </FlexboxGrid.Item>
        </PermissionControl>
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
                // <Link route={ImageEditRoute.create({id: rowData.id}, current ?? undefined)}>
                // <img
                //   src={rowData.thumbURL || ''}
                //   style={{height: '70', width: 'auto', display: 'block', margin: '0 auto'}}
                // />
                // </Link>
                <Link to={`/images/edit/${rowData.id}`}>
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
                  <PermissionControl qualifyingPermissions={['CAN_CREATE_IMAGE']}>
                    <IconButtonTooltip caption={t('images.overview.edit')}>
                      <>
                        <Link to={`/images/edit/${rowData.id}`}>
                          <IconButton
                            icon={<EditIcon />}
                            circle
                            size="sm"
                            style={{marginLeft: '5px'}}
                          />
                        </Link>
                      </>
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl qualifyingPermissions={['CAN_DELETE_IMAGE']}>
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
                  </PermissionControl>
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
          navigate('/images')
        }}>
        <ImageUploadAndEditPanel
          onClose={() => {
            setUploadModalOpen(false)
            navigate('/images')
          }}
          onUpload={() => {
            setUploadModalOpen(false)
            navigate('/images')
          }}
        />
      </Drawer>
      <Drawer
        open={isEditModalOpen}
        size={'sm'}
        onClose={() => {
          setEditModalOpen(false)
          navigate('/images')
        }}>
        <ImageEditPanel
          id={editID!}
          onClose={() => {
            setEditModalOpen(false)
            navigate('/images')
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

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_IMAGES',
  'CAN_GET_IMAGE',
  'CAN_DELETE_IMAGE',
  'CAN_CREATE_IMAGE'
])(ImageList)
export {CheckedPermissionComponent as ImageList}
