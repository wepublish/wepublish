import styled from '@emotion/styled';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  FullImageFragment,
  useImageListQuery,
  useUpdateImageMutation,
  useUploadImageMutation,
} from '@wepublish/editor/api';
import { PointerEvent, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdCheck, MdFileUpload } from 'react-icons/md';

import { prepareImageForUpload } from './image-convert';
import { readImageMetaData } from './image-metadata';

type FocalPoint = { x: number; y: number };

type ImageMeta = {
  title: string;
  description: string;
  source: string;
  link: string;
  license: string;
  focalPoint: FocalPoint;
};

const centerFocalPoint: FocalPoint = { x: 0.5, y: 0.5 };

const emptyMeta: ImageMeta = {
  title: '',
  description: '',
  source: '',
  link: '',
  license: '',
  focalPoint: centerFocalPoint,
};

const toMeta = (image: FullImageFragment | undefined): ImageMeta => ({
  title: image?.title ?? '',
  description: image?.description ?? '',
  source: image?.source ?? '',
  link: image?.link ?? '',
  license: image?.license ?? '',
  focalPoint:
    image ? { x: image.focalPointX, y: image.focalPointY } : centerFocalPoint,
});

const toVariables = ({ focalPoint, ...meta }: ImageMeta) => ({
  ...(Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [key, value || undefined])
  ) as Partial<Omit<ImageMeta, 'focalPoint'>>),
  focalPointX: focalPoint.x,
  focalPointY: focalPoint.y,
});

const FileDropzone = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 180px;
  padding: 16px;
  border: 2px dashed
    ${({ active, theme }) =>
      active ? theme.palette.primary.main : theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ active, theme }) =>
    active ? theme.palette.action.hover : 'transparent'};
  text-align: center;
`;

const PreviewWrapper = styled.div`
  position: relative;
  width: 100%;
  line-height: 0;
  cursor: crosshair;
  user-select: none;
  touch-action: none;

  img {
    pointer-events: none;
  }
`;

const Preview = styled.img`
  display: block;
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.palette.action.hover};
`;

const FocalPointMarker = styled.div`
  position: absolute;
  width: 24px;
  height: 24px;
  border: 3px solid ${({ theme }) => theme.palette.common.white};
  border-radius: 50%;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.6);
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

/**
 * The box the image is actually drawn in when using `object-fit: contain`,
 * relative to the element.
 */
const getContainedBox = (img: HTMLImageElement) => {
  const { width, height } = img.getBoundingClientRect();
  const { naturalWidth, naturalHeight } = img;

  if (!naturalWidth || !naturalHeight) {
    return { left: 0, top: 0, width, height };
  }

  const scale = Math.min(width / naturalWidth, height / naturalHeight);
  const drawnWidth = naturalWidth * scale;
  const drawnHeight = naturalHeight * scale;

  return {
    left: (width - drawnWidth) / 2,
    top: (height - drawnHeight) / 2,
    width: drawnWidth,
    height: drawnHeight,
  };
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

type FocalPointPreviewProps = {
  src: string;
  alt: string;
  value: FocalPoint;
  onChange: (point: FocalPoint) => void;
  disabled: boolean;
};

const FocalPointPreview = ({
  src,
  alt,
  value,
  onChange,
  disabled,
}: FocalPointPreviewProps) => {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState<ReturnType<typeof getContainedBox>>();

  const measure = () => {
    if (imgRef.current) {
      setBox(getContainedBox(imgRef.current));
    }
  };

  // Keep the marker aligned with the drawn image when the dialog resizes
  useEffect(() => {
    window.addEventListener('resize', measure);

    return () => window.removeEventListener('resize', measure);
  }, []);

  const [dragging, setDragging] = useState(false);

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!imgRef.current) {
      return;
    }

    const rect = imgRef.current.getBoundingClientRect();
    const contained = getContainedBox(imgRef.current);

    onChange({
      x: clamp((event.clientX - rect.left - contained.left) / contained.width),
      y: clamp((event.clientY - rect.top - contained.top) / contained.height),
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) {
      return;
    }

    event.preventDefault();
    setDragging(true);
    updateFromPointer(event);

    // Keeps receiving move events when the pointer leaves the preview
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional, dragging still works while hovering
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) {
      updateFromPointer(event);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) {
      setDragging(false);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  return (
    <PreviewWrapper
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title={
        disabled ? undefined : t('', 'Click or drag to set the focal point')
      }
    >
      <Preview
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={measure}
      />

      {box && (
        <FocalPointMarker
          style={{
            left: box.left + value.x * box.width,
            top: box.top + value.y * box.height,
          }}
        />
      )}
    </PreviewWrapper>
  );
};

const LibraryItem = styled(ImageListItem)<{ selected: boolean }>`
  cursor: pointer;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  overflow: hidden;
  outline: 3px solid
    ${({ selected, theme }) =>
      selected ? theme.palette.primary.main : 'transparent'};

  img {
    aspect-ratio: 1;
    object-fit: cover;
  }
`;

export type ImageDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  /**
   * The currently selected image, enables editing its metadata.
   */
  image?: FullImageFragment;
  /**
   * A file dropped onto the field, prefills the upload form.
   */
  file?: File | null;
};

type DialogTab = 'upload' | 'library';

const useFilePreview = (file: File | null) => {
  const [url, setUrl] = useState<string | null>(null);

  // Created inside the effect so a strict mode double invocation or a
  // remount never revokes a url that is still in use
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
};

type UploadTabProps = {
  image?: FullImageFragment;
  file: File | null;
  onFile: (file: File) => void;
  disabled: boolean;
};

const UploadTab = ({ image, file, onFile, disabled }: UploadTabProps) => {
  const { t } = useTranslation();
  const { control, watch, setValue } = useFormContext<ImageMeta>();
  const title = watch('title');
  const focalPoint = watch('focalPoint');
  const filePreview = useFilePreview(file);
  const preview = filePreview ?? image?.m ?? image?.url;

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled,
    onDrop: files => files[0] && onFile(files[0]),
  });

  return (
    <Stack spacing={2}>
      <FileDropzone
        {...getRootProps()}
        active={isDragActive}
      >
        <input {...getInputProps()} />

        {preview ?
          <FocalPointPreview
            src={preview}
            alt={title}
            value={focalPoint}
            disabled={disabled}
            onChange={point =>
              setValue('focalPoint', point, { shouldDirty: true })
            }
          />
        : <Typography
            variant="body2"
            color="text.secondary"
          >
            {t('', 'Drop an image here')}
          </Typography>
        }

        <Button
          variant={preview ? 'text' : 'contained'}
          size="small"
          startIcon={<MdFileUpload />}
          disabled={disabled}
          onClick={open}
        >
          {preview ? t('', 'Replace file') : t('', 'Select file')}
        </Button>

        {file && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {file.name}
          </Typography>
        )}

        {preview && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {t('', 'Click or drag on the image to set the focal point')}
          </Typography>
        )}
      </FileDropzone>

      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t('', 'Title')}
            size="small"
            disabled={disabled}
          />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t('', 'Description')}
            size="small"
            multiline
            minRows={2}
            disabled={disabled}
          />
        )}
      />

      <Stack
        direction="row"
        spacing={2}
      >
        <Controller
          name="source"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('', 'Source')}
              size="small"
              fullWidth
              disabled={disabled}
            />
          )}
        />

        <Controller
          name="license"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('', 'License')}
              size="small"
              fullWidth
              disabled={disabled}
            />
          )}
        />
      </Stack>

      <Controller
        name="link"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t('', 'Link')}
            size="small"
            type="url"
            disabled={disabled}
          />
        )}
      />
    </Stack>
  );
};

type LibraryTabProps = {
  selectedId?: string;
  onSelect: (image: FullImageFragment) => void;
};

const LibraryTab = ({ selectedId, onSelect }: LibraryTabProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data, loading, error } = useImageListQuery({
    variables: {
      take: 30,
      filter: search || undefined,
    },
  });

  const images = data?.images.nodes ?? [];

  return (
    <Stack spacing={2}>
      <TextField
        label={t('', 'Search')}
        size="small"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />

      {loading && <LinearProgress />}

      {error && <Alert severity="error">{error.message}</Alert>}

      {!loading && !images.length && (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {t('', 'No images found')}
        </Typography>
      )}

      <ImageList
        cols={3}
        gap={8}
      >
        {images.map(image => (
          <LibraryItem
            key={image.id}
            selected={image.id === selectedId}
            onClick={() => onSelect(image)}
          >
            <img
              src={image.thumbURL ?? image.url}
              alt={image.title ?? ''}
              loading="lazy"
            />

            <ImageListItemBar
              title={image.title || image.id}
              actionIcon={
                image.id === selectedId ?
                  <Box sx={{ color: 'common.white', display: 'flex', mr: 1 }}>
                    <MdCheck size={20} />
                  </Box>
                : undefined
              }
            />
          </LibraryItem>
        ))}
      </ImageList>
    </Stack>
  );
};

export const ImageDialog = ({
  open,
  onClose,
  onSelect,
  image,
  file: initialFile = null,
}: ImageDialogProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<DialogTab>('upload');
  const [file, setFile] = useState<File | null>(initialFile);
  const form = useForm<ImageMeta>({ defaultValues: emptyMeta });
  const [libraryImage, setLibraryImage] = useState<FullImageFragment>();

  const [upload, { loading: uploading, error: uploadError }] =
    useUploadImageMutation();
  const [update, { loading: updating, error: updateError }] =
    useUpdateImageMutation();

  // Prefills empty fields with the metadata embedded in the file
  const applyFileMeta = async (nextFile: File) => {
    const fileMeta = await readImageMetaData(nextFile);

    for (const [key, value] of Object.entries(fileMeta)) {
      const name = key as keyof ImageMeta;

      if (value && !form.getValues(name)) {
        form.setValue(name, value, { shouldDirty: true });
      }
    }
  };

  // Unsupported formats and oversized images are re-encoded as webp in the
  // browser. The metadata is read from the original file since re-encoding
  // drops it. The focal point belongs to the previous picture, so it is
  // reset to the center of the new one.
  const changeFile = async (nextFile: File) => {
    setFile(await prepareImageForUpload(nextFile));
    form.setValue('focalPoint', centerFocalPoint, { shouldDirty: true });
    applyFileMeta(nextFile);
  };

  // Reset the form only when the dialog opens. The image object changes
  // identity whenever the apollo cache updates (e.g. when the library tab
  // loads), which must not reset the form or the chosen file.
  useEffect(() => {
    if (open) {
      setTab('upload');
      setFile(null);
      form.reset(initialFile ? emptyMeta : toMeta(image));
      setLibraryImage(undefined);

      if (initialFile) {
        changeFile(initialFile);
      }
    }
  }, [open]);

  const saving = uploading || updating;
  const error = uploadError ?? updateError;
  const canSave = tab === 'upload' ? !!file || !!image : !!libraryImage;

  const save = async (meta: ImageMeta) => {
    if (tab === 'library') {
      if (libraryImage) {
        onSelect(libraryImage.id);
        onClose();
      }

      return;
    }

    if (file) {
      const { data } = await upload({
        variables: {
          ...toVariables(meta),
          tags: [],
          file,
          filename: file.name,
        },
      });

      if (data?.uploadImage) {
        onSelect(data.uploadImage.id);
        onClose();
      }

      return;
    }

    if (image) {
      const { data } = await update({
        variables: {
          id: image.id,
          ...toVariables(meta),
        },
      });

      if (data?.updateImage) {
        onSelect(data.updateImage.id);
        onClose();
      }
    }
  };

  const saveLabel =
    tab === 'library' ? t('', 'Use image')
    : file ? t('', 'Upload')
    : t('', 'Save');

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {image ? t('', 'Edit image') : t('', 'Choose image')}
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_event, value: DialogTab) => setTab(value)}
        sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          value="upload"
          label={image && !file ? t('', 'Edit') : t('', 'Upload')}
        />
        <Tab
          value="library"
          label={t('', 'Library')}
        />
      </Tabs>

      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {error.message}
          </Alert>
        )}

        {tab === 'upload' && (
          <FormProvider {...form}>
            <UploadTab
              image={image}
              file={file}
              onFile={changeFile}
              disabled={saving}
            />
          </FormProvider>
        )}

        {tab === 'library' && (
          <LibraryTab
            selectedId={libraryImage?.id ?? image?.id}
            onSelect={setLibraryImage}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={saving}
        >
          {t('', 'Cancel')}
        </Button>

        <Button
          variant="contained"
          onClick={form.handleSubmit(save)}
          disabled={saving || !canSave}
        >
          {saveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
