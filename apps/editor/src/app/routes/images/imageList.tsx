import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  DeleteImageDocument,
  FullImageFragment,
  ImageListDocument,
  ImageListQuery,
  LocalStorageKey,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  IconButton,
  IconButtonTooltip,
  ImageEditPanel,
  ImageUploadAndEditPanel,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  PaddedCell,
  PermissionControl,
  Table,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdDelete,
  MdEdit,
  MdOutlineAddPhotoAlternate,
  MdSearch,
  MdViewList,
  MdViewModule,
} from 'react-icons/md';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  ButtonGroup as RButtonGroup,
  Drawer,
  IconButton as RIconButton,
  Input,
  InputGroup,
  Modal,
  Pagination,
  Table as RTable,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

export enum ImageListLayout {
  Grid = 'grid',
  List = 'list',
}

const { Column, HeaderCell, Cell: RCell } = RTable;

const Img = styled.img`
  height: 70px;
  width: auto;
  display: block;
  margin: 0 auto;
`;
const ButtonGroup = styled(RButtonGroup)`
  margin-top: 10px;
`;

const GridImg = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  object-fit: cover;
  overflow: hidden;
  color: var(--rs-text-secondary);
  font-size: 12px;
  text-align: center;
  transition: transform 0.2s ease;
`;

const ImgDesc = styled.p`
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  margin: 0;
  padding: 8px 10px;
  overflow: hidden;
  color: #fff;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const GridIcon = styled(IconButton)`
  position: absolute;
  top: 8px;
  right: 8px;
`;

const GridView = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin: 20px 0;
`;

const ImageWrapper = styled.div`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid var(--rs-border-primary);
  border-radius: var(--wep-radius-md, 8px);
  background-color: var(--rs-bg-well);
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0;
  background: linear-gradient(to top, rgb(0 0 0 / 60%), transparent 50%);
  transition: opacity 0.2s ease;
`;

const OverlayContainer = styled.div`
  position: absolute;
  inset: 0;

  & a {
    display: block;
    height: 100%;
    color: unset;
  }

  &:hover,
  &:focus-within {
    & img {
      transform: scale(1.04);
    }

    ${Overlay} {
      opacity: 1;
    }
  }
`;

function ImageList() {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { id } = params;

  const isUploadRoute = location.pathname.includes('upload');
  const isEditRoute = location.pathname.includes('edit');

  const [images, setImages] = useState<FullImageFragment[]>([]);

  const { filter, setFilter, limit, setLimit } = useListViewState<string>(
    'images',
    { defaultFilter: '', defaultLimit: 50 }
  );

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<FullImageFragment>();

  const [activePage, setActivePage] = useState(1);

  const [isUploadModalOpen, setUploadModalOpen] = useState(isUploadRoute);
  const [isEditModalOpen, setEditModalOpen] = useState(isEditRoute);

  const [editID, setEditID] = useState<string | undefined>(
    isEditRoute ? id : undefined
  );

  const [layout, setLayout] = useState(
    localStorage.getItem(LocalStorageKey.ImageListLayout) ||
      ImageListLayout.Grid
  );

  const listVariables = {
    filter: filter || undefined,
    take: limit,
    skip: (activePage - 1) * limit,
  };

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(ImageListDocument, {
    variables: listVariables,
  });

  const [deleteImage, { loading: isDeleting }] = useMutation(
    DeleteImageDocument,
    {}
  );

  const { t } = useTranslation();

  useEffect(() => {
    if (data?.images?.nodes) {
      setImages(data.images.nodes as React.SetStateAction<FullImageFragment[]>);
    }
  }, [data?.images]);

  useEffect(() => {
    refetch(listVariables);
  }, [filter, activePage, limit]);

  useEffect(() => {
    if (isUploadRoute) {
      setUploadModalOpen(true);
    }

    if (isEditRoute) {
      setEditModalOpen(true);
      setEditID(id);
    }
  }, [location]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('images.overview.imageLibrary')}</h2>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_IMAGE']}>
          <ListViewActions>
            <Link
              to="/images/upload"
              state={{ modalLocation: location }}
            >
              <RIconButton
                appearance="primary"
                disabled={isLoading}
                icon={<MdOutlineAddPhotoAlternate />}
              >
                {t('images.overview.uploadImage')}
              </RIconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>

        <ListViewFilterArea>
          <InputGroup>
            <Input
              value={filter}
              onChange={value => {
                setFilter(value);
                setActivePage(1);
              }}
            />
            <InputGroup.Addon>
              <MdSearch />
            </InputGroup.Addon>
          </InputGroup>
        </ListViewFilterArea>
      </ListViewContainer>

      <ButtonGroup size="lg">
        <RIconButton
          active={layout === ImageListLayout.Grid}
          onClick={() => {
            setLayout(ImageListLayout.Grid);
            localStorage.setItem(
              LocalStorageKey.ImageListLayout,
              ImageListLayout.Grid
            );
          }}
          appearance={layout === ImageListLayout.Grid ? 'ghost' : 'default'}
          icon={<MdViewModule />}
        />
        <RIconButton
          onClick={() => {
            setLayout(ImageListLayout.List);
            localStorage.setItem(
              LocalStorageKey.ImageListLayout,
              ImageListLayout.List
            );
          }}
          appearance={layout === ImageListLayout.List ? 'ghost' : 'default'}
          active={layout === ImageListLayout.List}
          icon={<MdViewList />}
        />
      </ButtonGroup>

      <TableWrapper>
        {layout === ImageListLayout.List ?
          <ImageListView
            images={images}
            isLoading={isLoading}
            setConfirmationDialogOpen={setConfirmationDialogOpen}
            setCurrentImage={setCurrentImage}
          />
        : <ImageGridView
            images={images}
            setConfirmationDialogOpen={setConfirmationDialogOpen}
            setCurrentImage={setCurrentImage}
          />
        }

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
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
          onChangeLimit={limit => {
            setLimit(limit);
            setActivePage(1);
          }}
        />
      </TableWrapper>

      <Drawer
        open={isUploadModalOpen}
        size="sm"
        onClose={() => {
          setUploadModalOpen(false);
          navigate('/images');
        }}
      >
        <ImageUploadAndEditPanel
          onClose={() => {
            setUploadModalOpen(false);
            navigate('/images');
          }}
          onUpload={() => {
            setUploadModalOpen(false);
            navigate('/images');
          }}
        />
      </Drawer>
      <Drawer
        open={isEditModalOpen}
        size="sm"
        onClose={() => {
          setEditModalOpen(false);
          navigate('/images');
        }}
      >
        <ImageEditPanel
          id={editID!}
          onClose={() => {
            setEditModalOpen(false);
            navigate('/images');
          }}
        />
      </Drawer>
      <Modal
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
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
              if (!currentImage) {
                return;
              }

              await deleteImage({
                variables: { id: currentImage.id },
                update: cache => {
                  const query = cache.readQuery<ImageListQuery>({
                    query: ImageListDocument,
                    variables: listVariables,
                  });

                  if (!query) return;

                  cache.writeQuery<ImageListQuery>({
                    query: ImageListDocument,
                    data: {
                      __typename: 'Query',
                      images: {
                        ...query.images,
                        nodes: query.images.nodes.filter(
                          article => article.id !== currentImage.id
                        ),
                      },
                    },
                    variables: listVariables,
                  });
                },
              });
              setConfirmationDialogOpen(false);
            }}
            color="red"
          >
            {t('images.panels.confirm')}
          </Button>
          <Button
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('images.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_IMAGES',
  'CAN_GET_IMAGE',
  'CAN_DELETE_IMAGE',
  'CAN_CREATE_IMAGE',
])(ImageList);
export { CheckedPermissionComponent as ImageList };

interface ImageGridViewProps {
  images: FullImageFragment[];
  isLoading?: boolean;

  setCurrentImage(image: FullImageFragment): void;
  setConfirmationDialogOpen(isOpen: boolean): void;
}

const ImageGridView = ({
  images,
  setCurrentImage,
  setConfirmationDialogOpen,
}: ImageGridViewProps) => {
  return (
    <GridView>
      {images.map(image => {
        return (
          <ImageWrapper key={image.id}>
            <OverlayContainer>
              <Link to={`/images/edit/${image.id}`}>
                <Overlay>
                  <GridIcon
                    icon={<MdDelete />}
                    circle
                    size="md"
                    appearance="default"
                    color="red"
                    data-on-media
                    onClick={event => {
                      event.preventDefault();
                      setCurrentImage(image);
                      setConfirmationDialogOpen(true);
                    }}
                  />
                  {image?.title && <ImgDesc>{image?.title}</ImgDesc>}
                </Overlay>
                <GridImg
                  src={image?.squareURL || ''}
                  alt={image?.title || image?.filename || ''}
                />
              </Link>
            </OverlayContainer>
          </ImageWrapper>
        );
      })}
    </GridView>
  );
};

const ImageListView = ({
  images,
  isLoading,
  setConfirmationDialogOpen,
  setCurrentImage,
}: ImageGridViewProps) => {
  const { t } = useTranslation();
  return (
    <Table
      fillHeight
      data={images}
      rowHeight={100}
      loading={isLoading}
      wordWrap
      className={'displayThreeLinesOnly'}
    >
      <Column
        width={160}
        align="left"
        resizable
      >
        <HeaderCell>{t('images.overview.image')}</HeaderCell>
        <RCell>
          {(rowData: RowDataType<FullImageFragment>) => (
            <Link to={`/images/edit/${rowData.id}`}>
              <Img src={rowData.thumbURL || ''} />
            </Link>
          )}
        </RCell>
      </Column>
      <Column
        width={160}
        align="left"
        resizable
      >
        <HeaderCell>{t('images.overview.title')}</HeaderCell>
        <RCell className="displayThreeLinesOnly">
          {(rowData: RowDataType<FullImageFragment>) => (
            <p className={'displayThreeLinesOnly'}>
              {rowData.title ? rowData.title : t('images.overview.untitled')}
            </p>
          )}
        </RCell>
      </Column>
      <Column
        width={340}
        align="left"
        resizable
      >
        <HeaderCell>{t('images.overview.description')}</HeaderCell>
        <RCell className={'displayThreeLinesOnly'}>
          {(rowData: RowDataType<FullImageFragment>) => (
            <p className={'displayThreeLinesOnly'}>
              {rowData.description ?
                rowData.description
              : t('images.overview.noDescription')}
            </p>
          )}
        </RCell>
      </Column>

      <Column
        width={250}
        align="left"
        resizable
      >
        <HeaderCell>{t('images.overview.filename')}</HeaderCell>
        <RCell>
          {(rowData: RowDataType<FullImageFragment>) => (
            <p className={'displayThreeLinesOnly'}>
              {rowData.filename ? rowData.filename : ''}
            </p>
          )}
        </RCell>
      </Column>

      <Column
        width={100}
        align="center"
        resizable
        fixed="right"
      >
        <HeaderCell>{t('images.overview.actions')}</HeaderCell>
        <PaddedCell>
          {(rowData: RowDataType<FullImageFragment>) => (
            <>
              <PermissionControl qualifyingPermissions={['CAN_CREATE_IMAGE']}>
                <IconButtonTooltip caption={t('images.overview.edit')}>
                  <Link to={`/images/edit/${rowData.id}`}>
                    <IconButton
                      icon={<MdEdit />}
                      circle
                      size="sm"
                    />
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
                      event.preventDefault();
                      setCurrentImage(rowData as FullImageFragment);
                      setConfirmationDialogOpen(true);
                    }}
                  />
                </IconButtonTooltip>
              </PermissionControl>
            </>
          )}
        </PaddedCell>
      </Column>
    </Table>
  );
};
