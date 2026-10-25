import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  ButtonGroup as MuiButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import {
  DeleteImageDocument,
  FullImageFragment,
  ImageListDocument,
  ImageListQuery,
  LocalStorageKey,
} from '@wepublish/editor/api';
import {
  CanCreateImage,
  CanDeleteImage,
  CanGetImage,
  CanGetImages,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  DRAWER_WIDTHS,
  IconButton,
  IconButtonTooltip,
  ImageEditPanel,
  ImageUploadAndEditPanel,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  Pagination,
  PermissionControl,
  TableWrapper,
  useListViewState,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdDelete,
  MdEdit,
  MdOutlineAddPhotoAlternate,
  MdSearch,
  MdViewList,
  MdViewModule,
} from 'react-icons/md';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

export enum ImageListLayout {
  Grid = 'grid',
  List = 'list',
}

const Img = styled.img`
  height: 70px;
  width: auto;
  display: block;
  margin: 0 auto;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
`;
const ButtonGroup = styled(MuiButtonGroup)`
  margin-top: 12px;
`;

const GridImg = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  object-fit: cover;
  overflow: hidden;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-size: 12px;
  text-align: center;
  transition: transform 0.2s ease;
`;

const ImgDesc = styled.p`
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  margin: 0;
  padding: 8px 12px;
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
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s ease;
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
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
  background-color: ${({ theme }) => theme.vars.palette.background.default};
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

    ${Overlay}, ${GridIcon} {
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

  const { filter, setFilter, limit, setLimit } = useListViewState<string>(
    'images',
    { defaultFilter: '', defaultLimit: 50 }
  );

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<FullImageFragment>();

  const [activePage, setActivePage] = useState(1);

  const isUploadModalOpen = isUploadRoute;
  const isEditModalOpen = isEditRoute;
  const editID = isEditRoute ? id : undefined;
  const closeDrawer = () => navigate('/images');

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

  const images = data?.images.nodes ?? [];

  const [deleteImage, { loading: isDeleting }] = useMutation(
    DeleteImageDocument,
    {}
  );

  const { t } = useTranslation();

  useEffect(() => {
    refetch(listVariables);
  }, [filter, activePage, limit]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('images.overview.imageLibrary')}</PageTitle>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreateImage.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/images/upload"
              state={{ modalLocation: location }}
              variant="contained"
              startIcon={<MdOutlineAddPhotoAlternate />}
              disabled={isLoading}
            >
              {t('images.overview.uploadImage')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <ListToolbar>
        <ButtonGroup size="large">
          <IconButtonTooltip caption={t('images.overview.gridView')}>
            <IconButton
              aria-label={t('images.overview.gridView')}
              aria-pressed={layout === ImageListLayout.Grid}
              sx={{
                bgcolor:
                  layout === ImageListLayout.Grid ?
                    'action.selected'
                  : undefined,
              }}
              onClick={() => {
                setLayout(ImageListLayout.Grid);
                localStorage.setItem(
                  LocalStorageKey.ImageListLayout,
                  ImageListLayout.Grid
                );
              }}
            >
              <MdViewModule />
            </IconButton>
          </IconButtonTooltip>
          <IconButtonTooltip caption={t('images.overview.listView')}>
            <IconButton
              aria-label={t('images.overview.listView')}
              aria-pressed={layout === ImageListLayout.List}
              sx={{
                bgcolor:
                  layout === ImageListLayout.List ?
                    'action.selected'
                  : undefined,
              }}
              onClick={() => {
                setLayout(ImageListLayout.List);
                localStorage.setItem(
                  LocalStorageKey.ImageListLayout,
                  ImageListLayout.List
                );
              }}
            >
              <MdViewList />
            </IconButton>
          </IconButtonTooltip>
        </ButtonGroup>

        <Search
          label={t('search')}
          size="small"
          value={filter}
          onChange={event => {
            setFilter(event.target.value);
            setActivePage(1);
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <MdSearch />
                </InputAdornment>
              ),
            },
          }}
        />
      </ListToolbar>

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
          state={{
            page: activePage,
            limit,
            setPage: setActivePage,
            setLimit: limit => {
              setLimit(limit);
              setActivePage(1);
            },
          }}
          totalCount={data?.images.totalCount ?? 0}
        />
      </TableWrapper>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isUploadModalOpen}
        onClose={closeDrawer}
      >
        <ImageUploadAndEditPanel
          onClose={closeDrawer}
          onUpload={closeDrawer}
        />
      </Drawer>
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isEditModalOpen}
        onClose={closeDrawer}
      >
        <ImageEditPanel
          id={editID!}
          onClose={closeDrawer}
        />
      </Drawer>
      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('images.panels.deleteImage')}</DialogTitle>

        <DialogContent>
          <Typography>
            {`${currentImage?.filename || t('images.panels.untitled')}${currentImage?.extension}` ||
              '-'}
          </Typography>
          <Typography>
            {currentImage?.title || t('images.panels.untitled')}
          </Typography>
          <Typography>{currentImage?.description || '-'}</Typography>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('images.panels.cancel')}
          </Button>

          <Button
            variant="contained"
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

                  if (!query) {
                    return;
                  }

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
            color="error"
          >
            {t('images.panels.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetImages.id,
  CanGetImage.id,
  CanDeleteImage.id,
  CanCreateImage.id,
])(ImageList);
export { CheckedPermissionComponent as ImageList };

interface ImageGridViewProps {
  images: FullImageFragment[];
  isLoading?: boolean;

  setCurrentImage(image: FullImageFragment): void;
  setConfirmationDialogOpen(isOpen: boolean): void;
}

const ListToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const Search = styled(TextField)`
  width: 320px;
  max-width: 100%;
`;

const ImageGridView = ({
  images,
  setCurrentImage,
  setConfirmationDialogOpen,
}: ImageGridViewProps) => {
  const { t } = useTranslation();

  return (
    <GridView>
      {images.map(image => {
        return (
          <ImageWrapper key={image.id}>
            <OverlayContainer>
              <Link to={`/images/edit/${image.id}`}>
                <Overlay>
                  {image?.title && <ImgDesc>{image?.title}</ImgDesc>}
                </Overlay>
                <GridImg
                  src={image?.squareURL || ''}
                  alt={
                    image?.title ? '' : (
                      image?.filename || t('images.overview.untitled')
                    )
                  }
                />
              </Link>
              <IconButtonTooltip caption={t('delete')}>
                <GridIcon
                  aria-label={`${t('delete')} ${image?.title || image?.filename || t('images.overview.untitled')}`}
                  size="medium"
                  color="error"
                  data-on-media
                  onClick={() => {
                    setCurrentImage(image);
                    setConfirmationDialogOpen(true);
                  }}
                >
                  <MdDelete />
                </GridIcon>
              </IconButtonTooltip>
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
    <DataTable
      storageKey="images"
      data={images}
      loading={isLoading}
      columns={[
        {
          id: 'image',
          label: t('images.overview.image'),
          width: 160,
          align: 'left',
          render: rowData => (
            <Link to={`/images/edit/${rowData.id}`}>
              <Img
                src={rowData.thumbURL || ''}
                alt={
                  rowData.title ||
                  rowData.filename ||
                  t('images.overview.untitled')
                }
              />
            </Link>
          ),
        },
        {
          id: 'title',
          alwaysVisible: true,
          label: t('images.overview.title'),
          width: 160,
          align: 'left',
          render: rowData => (
            <Typography className={'displayThreeLinesOnly'}>
              {rowData.title ? rowData.title : t('images.overview.untitled')}
            </Typography>
          ),
        },
        {
          id: 'description',
          label: t('images.overview.description'),
          width: 340,
          align: 'left',
          render: rowData => (
            <Typography className={'displayThreeLinesOnly'}>
              {rowData.description ?
                rowData.description
              : t('images.overview.noDescription')}
            </Typography>
          ),
        },
        {
          id: 'filename',
          label: t('images.overview.filename'),
          width: 250,
          align: 'left',
          render: rowData => (
            <Typography className={'displayThreeLinesOnly'}>
              {rowData.filename ? rowData.filename : ''}
            </Typography>
          ),
        },
        {
          id: 'action',
          label: t('action'),
          width: 140,
          align: 'center',
          fixed: true,
          render: rowData => (
            <>
              <PermissionControl qualifyingPermissions={[CanCreateImage.id]}>
                <IconButtonTooltip caption={t('images.overview.edit')}>
                  <IconButton
                    component={RouterLink}
                    to={`/images/edit/${rowData.id}`}
                    aria-label={t('images.overview.edit')}
                    size="small"
                  >
                    <MdEdit />
                  </IconButton>
                </IconButtonTooltip>
              </PermissionControl>
              <PermissionControl qualifyingPermissions={[CanDeleteImage.id]}>
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    aria-label={t('delete')}
                    size="small"
                    color="error"
                    onClick={event => {
                      event.preventDefault();
                      setCurrentImage(rowData as FullImageFragment);
                      setConfirmationDialogOpen(true);
                    }}
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              </PermissionControl>
            </>
          ),
        },
      ]}
    />
  );
};
