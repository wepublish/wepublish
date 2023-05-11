import styled from '@emotion/styled'
import {
  FullImageFragment,
  ImageListDocument,
  ImageListQuery,
  ImageRefFragment,
  useDeleteImageMutation,
  useImageListQuery
} from '@wepublish/editor/api'
import {
  IconButton,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  PaddedCell,
  Table,
  TableWrapper
} from '@wepublish/ui/editor'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  MdDelete,
  MdEdit,
  MdOutlineAddPhotoAlternate,
  MdSearch,
  MdViewList,
  MdViewModule
} from 'react-icons/md'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {
  Button,
  ButtonGroup as RButtonGroup,
  Col as RCol,
  Drawer,
  Grid,
  IconButton as RIconButton,
  Input,
  InputGroup,
  Modal,
  Pagination,
  Row,
  Table as RTable
} from 'rsuite'
import {RowDataType} from 'rsuite-table'

import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {createCheckedPermissionComponent, PermissionControl} from '../atoms/permissionControl'
import {ImageEditPanel} from '../panel/imageEditPanel'
import {ImageUploadAndEditPanel} from '../panel/imageUploadAndEditPanel'
import {DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_IMAGE_PAGE_SIZES, LocalStorageKey} from '../utility'

const {Column, HeaderCell, Cell: RCell} = RTable

const Img = styled.img`
  height: 70px;
  width: auto;
  display: block;
  margin: 0 auto;
`
const ButtonGroup = styled(RButtonGroup)`
  margin-top: 10px;
`

const GridImg = styled.img`
  height: 120px;
  width: auto;
  display: block;
  margin: 0 auto;
`

const ImgDesc = styled.p`
  position: absolute;
  bottom: 10px;
  width: 100%;
  text-align: center;
  font-size: 12px;
  text-shadow: 1px 1px white;
`
const GridIcon = styled(IconButton)`
  position: absolute;
  top: 5px;
  right: 15px;
`

const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
`

const OverlayContainer = styled.div`
position: relative;
& a {
  color: unset;
  }
&:hover {
  & img {
    height: 130px;
    transition: .2s ease;
  }
  & div {
  opacity: 0.8;
    }
  }
}
`
const Col = styled(RCol)`
  height: 200px;
  overflow: hidden;
  &:hover {
    overflow: visible;
  }
`

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
  const [limit, setLimit] = useState(DEFAULT_TABLE_IMAGE_PAGE_SIZES[0])

  const [isUploadModalOpen, setUploadModalOpen] = useState(isUploadRoute)
  const [isEditModalOpen, setEditModalOpen] = useState(isEditRoute)

  const [editID, setEditID] = useState<string | undefined>(isEditRoute ? id : undefined)

  const [isGrid, setIsGrid] = useState<boolean>(
    JSON.parse(localStorage.getItem(LocalStorageKey.isGridView) || 'true')
  )

  const listVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (activePage - 1) * limit
  }

  const {
    data,
    refetch,
    loading: isLoading
  } = useImageListQuery({
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

  const ImageListView = () => (
    <Table
      fillHeight
      data={images}
      rowHeight={100}
      loading={isLoading}
      wordWrap
      className={'displayThreeLinesOnly'}>
      <Column width={160} align="left" resizable>
        <HeaderCell>{t('images.overview.image')}</HeaderCell>
        <RCell>
          {(rowData: RowDataType<ImageRefFragment>) => (
            <Link to={`/images/edit/${rowData.id}`}>
              <Img src={rowData.thumbURL || ''} />
            </Link>
          )}
        </RCell>
      </Column>
      <Column width={160} align="left" resizable>
        <HeaderCell>{t('images.overview.title')}</HeaderCell>
        <RCell className="displayThreeLinesOnly">
          {(rowData: RowDataType<ImageRefFragment>) => (
            <p className={'displayThreeLinesOnly'}>
              {rowData.title ? rowData.title : t('images.overview.untitled')}
            </p>
          )}
        </RCell>
      </Column>
      <Column width={340} align="left" resizable>
        <HeaderCell>{t('images.overview.description')}</HeaderCell>
        <RCell className={'displayThreeLinesOnly'}>
          {(rowData: RowDataType<ImageRefFragment>) => (
            <p className={'displayThreeLinesOnly'}>
              {rowData.description ? rowData.description : t('images.overview.noDescription')}
            </p>
          )}
        </RCell>
      </Column>

      <Column width={250} align="left" resizable>
        <HeaderCell>{t('images.overview.filename')}</HeaderCell>
        <RCell>
          {(rowData: RowDataType<ImageRefFragment>) => (
            <p className={'displayThreeLinesOnly'}>{rowData.filename ? rowData.filename : ''}</p>
          )}
        </RCell>
      </Column>

      <Column width={100} align="center" resizable fixed="right">
        <HeaderCell>{t('images.overview.actions')}</HeaderCell>
        <PaddedCell>
          {(rowData: RowDataType<ImageRefFragment>) => (
            <>
              <PermissionControl qualifyingPermissions={['CAN_CREATE_IMAGE']}>
                <IconButtonTooltip caption={t('images.overview.edit')}>
                  <Link to={`/images/edit/${rowData.id}`}>
                    <IconButton icon={<MdEdit />} circle size="sm" />
                  </Link>
                </IconButtonTooltip>
              </PermissionControl>
              <PermissionControl qualifyingPermissions={['CAN_DELETE_IMAGE']}>
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    icon={<MdDelete />}
                    circle
                    size="sm"
                    appearance="ghost"
                    color="red"
                    onClick={event => {
                      event.preventDefault()
                      setCurrentImage(rowData as ImageRefFragment)
                      setConfirmationDialogOpen(true)
                    }}
                  />
                </IconButtonTooltip>
              </PermissionControl>
            </>
          )}
        </PaddedCell>
      </Column>
    </Table>
  )
  const ImageGridView = () => (
    <Grid>
      <Row gutter={20}>
        {images.map(image => {
          return (
            <Col xs={24} sm={12} md={6} lg={4}>
              <OverlayContainer>
                <Link to={`/images/edit/${image.id}`}>
                  <Overlay>
                    <GridIcon
                      icon={<MdDelete />}
                      circle
                      size="md"
                      appearance="default"
                      onClick={event => {
                        event.preventDefault()
                        setCurrentImage(image as ImageRefFragment)
                        setConfirmationDialogOpen(true)
                      }}
                    />

                    <ImgDesc>{image?.title}</ImgDesc>
                  </Overlay>
                  <GridImg src={image?.squareURL || ''} />
                </Link>
              </OverlayContainer>
            </Col>
          )
        })}
      </Row>
    </Grid>
  )

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('images.overview.imageLibrary')}</h2>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_IMAGE']}>
          <ListViewActions>
            <Link to="/images/upload" state={{modalLocation: location}}>
              <RIconButton
                appearance="primary"
                disabled={isLoading}
                icon={<MdOutlineAddPhotoAlternate />}>
                {t('images.overview.uploadImage')}
              </RIconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>

        <ListViewFilterArea>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <MdSearch />
            </InputGroup.Addon>
          </InputGroup>
        </ListViewFilterArea>
      </ListViewContainer>

      <ButtonGroup size="lg">
        <RIconButton
          active={isGrid}
          onClick={() => {
            setIsGrid(true)
            localStorage.setItem(LocalStorageKey.isGridView, 'true')
          }}
          appearance={isGrid ? 'ghost' : 'default'}
          icon={<MdViewModule />}
        />
        <RIconButton
          onClick={() => {
            setIsGrid(false)
            localStorage.setItem(LocalStorageKey.isGridView, 'false')
          }}
          appearance={!isGrid ? 'ghost' : 'default'}
          active={!isGrid}
          icon={<MdViewList />}
        />
      </ButtonGroup>

      <TableWrapper>
        {!isGrid ? <ImageListView /> : <ImageGridView />}

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
      </TableWrapper>

      <Drawer
        open={isUploadModalOpen}
        size="sm"
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
        size="sm"
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
