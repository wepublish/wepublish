import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  ButtonBase,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { FullImageFragment, ImageDocument } from '@wepublish/editor/api';
import {
  CanDeleteImage,
  CanGetImage,
  CanGetImages,
} from '@wepublish/permissions';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFileUpload, MdSearch } from 'react-icons/md';

import { FileDropInput } from '../atoms/fileDropInput';
import { isFinishedImageUpload } from '../atoms/imageUploadQueue';
import { ImageUploadTile } from '../atoms/imageUploadTile';
import { createCheckedPermissionComponent } from '../atoms/permissionControl';
import { useImageUploadQueue } from '../atoms/useImageUpload';
import {
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getImgMinSizeToCompress } from '../utility';
import {
  addToImageSelection,
  canAddToImageSelection,
  toggleImageSelection,
} from './imageSelection';
import { useImageList } from './useImageList';

const SEARCH_DEBOUNCE_MS = 300;

export const ImageMultiSelectBody = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  align-content: start;
`;

export const ImageMultiSelectDropZone = styled.div`
  height: 120px;
`;

export const ImageMultiSelectUploads = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const ImageMultiSelectUploadsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const ImageMultiSelectTileList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const ImageMultiSelectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(160px, calc(50% - ${({ theme }) => theme.spacing(1)})), 1fr)
  );
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const SelectableImageCard = styled(Card, {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected: boolean }>`
  position: relative;
  height: 100%;
  border-color: ${({ selected, theme }) =>
    selected ? theme.vars.palette.primary.main : theme.vars.palette.divider};
  box-shadow: ${({ selected, theme }) =>
    selected ? `inset 0 0 0 1px ${theme.vars.palette.primary.main}` : 'none'};

  &:hover {
    border-color: ${({ theme }) => theme.vars.palette.primary.main};
  }
`;

export const SelectableImageAction = styled(CardActionArea)`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  &.Mui-disabled {
    opacity: 0.5;
  }
`;

export const SelectableImageThumbnail = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

export const SelectableImageCaption = styled(CardContent)`
  width: 100%;
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.25)};
`;

export const ImageSelectionOrder = styled('span', {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected: boolean }>`
  position: absolute;
  top: ${({ theme }) => theme.spacing(1)};
  right: ${({ theme }) => theme.spacing(1)};
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.vars.palette.common.white};
  background-color: ${({ selected, theme }) =>
    selected ? theme.vars.palette.primary.main : 'rgba(0, 0, 0, 0.35)'};
  color: ${({ theme }) => theme.vars.palette.primary.contrastText};
  font-size: 0.8125rem;
  font-weight: 600;
  pointer-events: none;
`;

export const ImageSelectionTray = styled(DrawerFooter)`
  flex-wrap: wrap;
  justify-content: space-between;
`;

export const ImageSelectionTrayImages = styled.ul`
  display: flex;
  gap: ${({ theme }) => theme.spacing(0.75)};
  flex: 1 1 200px;
  min-width: 0;
  margin: 0;
  padding: ${({ theme }) => theme.spacing(0.5, 0)};
  overflow-x: auto;
  list-style: none;
`;

export const ImageSelectionTrayButton = styled(ButtonBase)`
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  overflow: hidden;
  border-radius: calc(${({ theme }) => theme.shape.borderRadius}px * 0.75);
  background-color: ${({ theme }) => theme.vars.palette.background.default};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.Mui-focusVisible {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 2px;
  }
`;

export const ImageSelectionTrayActions = styled(DrawerActions)`
  margin-left: auto;
`;

export const ImageMultiSelectLoading = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
  justify-content: center;
`;

type SelectionTrayImageProps = {
  id: string;
  image?: FullImageFragment;
  onDeselect(): void;
};

function SelectionTrayImage({
  id,
  image,
  onDeselect,
}: SelectionTrayImageProps) {
  const { t } = useTranslation();
  const { data } = useQuery(ImageDocument, {
    variables: { id },
    skip: Boolean(image),
  });
  const shown = image ?? data?.image;
  const title = shown?.title || t('images.panels.untitled');

  return (
    <li>
      <ImageSelectionTrayButton
        aria-label={t('images.panels.deselectImage', { title })}
        title={title}
        onClick={onDeselect}
      >
        {shown?.thumbURL && (
          <img
            src={shown.thumbURL}
            alt=""
          />
        )}
      </ImageSelectionTrayButton>
    </li>
  );
}

export interface ImageMultiSelectPanelProps {
  selectedIds?: string[];
  max?: number;
  onClose(): void;
  onConfirm(ids: string[]): void;
}

function ImageMultiSelectPanel({
  selectedIds,
  max,
  onClose,
  onConfirm,
}: ImageMultiSelectPanelProps) {
  const { t } = useTranslation();
  const uploadsHeadingId = useId();
  const [initialIds] = useState(() => selectedIds ?? []);
  const [selection, setSelection] = useState(initialIds);
  const [search, setSearch] = useState('');
  const filter = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const { images, hasMore, loading, loadMore } = useImageList(filter);
  const { uploads, enqueue, retry, remove, clearFinished } =
    useImageUploadQueue({
      onUploaded: image =>
        setSelection(current => addToImageSelection(current, image.id, max)),
    });

  const knownImages = new Map<string, FullImageFragment>();

  for (const image of images) {
    knownImages.set(image.id, image);
  }

  for (const { image } of uploads) {
    if (image) {
      knownImages.set(image.id, image);
    }
  }

  const canAdd = canAddToImageSelection(selection, max);
  const hasFinishedUploads = uploads.some(isFinishedImageUpload);

  const toggle = (id: string) =>
    setSelection(current => toggleImageSelection(current, id, max));

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('images.panels.chooseImages')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose()}
          >
            {t('articleEditor.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <ImageMultiSelectBody>
          <div>
            <ImageMultiSelectDropZone>
              <FileDropInput
                multiple
                accept="image/*"
                icon={<MdFileUpload />}
                text={t('images.panels.dropImages')}
                onDrop={enqueue}
              />
            </ImageMultiSelectDropZone>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {t('images.panels.resizedImage', {
                sizeMB: getImgMinSizeToCompress(),
              })}
            </Typography>
          </div>

          {uploads.length > 0 && (
            <ImageMultiSelectUploads>
              <ImageMultiSelectUploadsHeader>
                <Typography
                  variant="subtitle2"
                  component="h3"
                  id={uploadsHeadingId}
                >
                  {t('images.panels.uploads')}
                </Typography>

                {hasFinishedUploads && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={clearFinished}
                  >
                    {t('images.panels.clearFinished')}
                  </Button>
                )}
              </ImageMultiSelectUploadsHeader>

              <ImageMultiSelectTileList
                aria-labelledby={uploadsHeadingId}
                aria-live="polite"
              >
                {uploads.map(upload => (
                  <ImageUploadTile
                    key={upload.key}
                    upload={upload}
                    onRetry={() => retry(upload.key)}
                    onRemove={() => remove(upload.key)}
                  />
                ))}
              </ImageMultiSelectTileList>
            </ImageMultiSelectUploads>
          )}

          <TextField
            fullWidth
            size="small"
            value={search}
            label={t('articleEditor.panels.images')}
            onChange={event => setSearch(event.target.value)}
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

          {images.length ?
            <>
              <ImageMultiSelectGrid>
                {images.map(image => {
                  const { id, mediumURL, title, filename, extension } = image;
                  const order = selection.indexOf(id) + 1;
                  const selected = order > 0;

                  return (
                    <SelectableImageCard
                      key={id}
                      variant="outlined"
                      selected={selected}
                    >
                      <SelectableImageAction
                        aria-pressed={selected}
                        disabled={!selected && !canAdd}
                        onClick={() => toggle(id)}
                      >
                        <SelectableImageThumbnail
                          src={mediumURL || ''}
                          alt=""
                        />

                        <SelectableImageCaption>
                          <Typography
                            variant="subtitle2"
                            noWrap
                          >
                            {title || t('images.panels.untitled')}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            {`${filename ?? ''}${extension ?? ''}`}
                          </Typography>
                        </SelectableImageCaption>

                        <ImageSelectionOrder
                          selected={selected}
                          aria-hidden
                          data-testid="image-selection-order"
                        >
                          {selected ? order : null}
                        </ImageSelectionOrder>
                      </SelectableImageAction>
                    </SelectableImageCard>
                  );
                })}
              </ImageMultiSelectGrid>

              {hasMore && (
                <Button
                  variant="text"
                  onClick={loadMore}
                >
                  {t('articleEditor.panels.loadMore')}
                </Button>
              )}
            </>
          : !loading ?
            <Alert severity="info">
              {t('articleEditor.panels.noImagesFound')}
            </Alert>
          : <ImageMultiSelectLoading>
              <CircularProgress size={20} />
              <span>{t('articleEditor.panels.loading')}</span>
            </ImageMultiSelectLoading>
          }
        </ImageMultiSelectBody>
      </DrawerBody>

      <ImageSelectionTray>
        {selection.length > 0 && (
          <ImageSelectionTrayImages
            aria-label={t('images.panels.selectedImages')}
          >
            {selection.map(id => (
              <SelectionTrayImage
                key={id}
                id={id}
                image={knownImages.get(id)}
                onDeselect={() => toggle(id)}
              />
            ))}
          </ImageSelectionTrayImages>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {max === undefined ?
            t('images.panels.selectedCount', { count: selection.length })
          : t('images.panels.selectedOfMax', {
              count: selection.length,
              max,
            })
          }
        </Typography>

        <ImageSelectionTrayActions>
          <Button
            variant="text"
            disabled={selection.length === 0}
            onClick={() => setSelection([])}
          >
            {t('images.panels.clearSelection')}
          </Button>

          <Button
            variant="contained"
            disabled={initialIds.length === 0 && selection.length === 0}
            onClick={() => onConfirm(selection)}
          >
            {initialIds.length > 0 ?
              t('images.panels.done')
            : t('images.panels.addImages', { count: selection.length })}
          </Button>
        </ImageSelectionTrayActions>
      </ImageSelectionTray>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetImage.id,
  CanGetImages.id,
  CanDeleteImage.id,
])(ImageMultiSelectPanel);
export { CheckedPermissionComponent as ImageMultiSelectPanel };
