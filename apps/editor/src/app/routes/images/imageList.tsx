import styled from '@emotion/styled';
import {
  FullImageFragment,
  getApiClientV2,
  ImageListDocument,
  ImageListQuery,
  LocalStorageKey,
  useDeleteImageMutation,
  useImageListQuery,
} from '@wepublish/editor/api-v2';
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
  height: 140px;
  width: auto;
  display: block;
  margin: 0 auto;
`;

const ImgDesc = styled.p`
  position: absolute;
  bottom: 10px;
  width: 100%;
  text-align: center;
  font-size: 12px;
  text-shadow: 1px 1px white;
  display: inline-block;
  background: white;
  padding: 2px;
`;
const GridIcon = styled(IconButton)`
  position: absolute;
  top: 5px;
  right: 5px;
`;

const GridView = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  row-gap: 20px;
  margin: 20px 0;
`;

const ImageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20%;
  height: 150px;
  @media (max-width: 1080px) {
    width: 25%;
  }
  @media (max-width: 900px) {
    width: 50%;
  }
  @media (max-width: 600px) {
    width: 100%;
  }
`;

const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
`;

const OverlayContainer = styled.div`
  position: relative;
  & a {
    color: unset;
  }
  &:hover {
    & img {
      height: 145px;
      transition: 0.2s ease;
    }
    ${Overlay} {
      opacity: 0.8;
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

  const [filter, setFilter] = useState('');

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<FullImageFragment>();

  const [activePage, setActivePage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_TABLE_PAGE_SIZES[0]);

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

  const client = getApiClientV2();
  const {
    data,
    refetch,
    loading: isLoading,
  } = useImageListQuery({
    client,
    fetchPolicy: 'network-only',
    variables: listVariables,
  });

  const [deleteImage, { loading: isDeleting }] = useDeleteImageMutation({
    client,
  });

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
              onChange={value => setFilter(value)}
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
          onChangeLimit={limit => setLimit(limit)}
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
              if (!currentImage) return;

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
                    onClick={event => {
                      event.preventDefault();
                      setCurrentImage(image);
                      setConfirmationDialogOpen(true);
                    }}
                  />
                  {image?.title && <ImgDesc>{image?.title}</ImgDesc>}
                </Overlay>
                <GridImg src={image?.squareURL || ''} />
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
