import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Autocomplete, Button, Link, TextField } from '@mui/material';
import {
  FullImageFragment,
  ImageDocument,
  UpdateImageDocument,
} from '@wepublish/editor/api';
import {
  CanCreateImage,
  CanDeleteImage,
  CanGetImage,
  CanGetImages,
} from '@wepublish/permissions';
import prettyBytes from 'pretty-bytes';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { DescriptionList, DescriptionListItem } from '../atoms/descriptionList';
import { Point } from '../atoms/draggable';
import { FocalPointInput } from '../atoms/focalPointInput';
import { ImageMetaData } from '../atoms/imageMetaData';
import { InfoTooltip } from '../atoms/infoTooltip';
import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms/permissionControl';
import { prepareImageForUpload } from '../atoms/prepareImageForUpload';
import { useUploadImage } from '../atoms/useImageUpload';
import { ImageBlockValue } from '../blocks';
import {
  DrawerActions,
  DrawerBody,
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
  FormFields,
  FormSectionTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';

export interface ImageEditPanelProps {
  block?: ImageBlockValue;
  id?: string;
  file?: File;
  imageMetaData?: ImageMetaData;

  onClose?(): void;
  onSave?(image: FullImageFragment, block: ImageBlockValue | undefined): void;
}

const EMPTY_IMAGE = {
  filename: '',
  title: '',
  description: '',
  tags: [] as string[],
  source: '',
  link: '',
  license: '',
  focalPoint: { x: 0.5, y: 0.5 } as Point,
  imageBlock: undefined as ImageBlockValue | undefined,
  fileSize: 0,
  extension: '',
  imageURL: '',
  originalImageURL: undefined as string | undefined,
  imageWidth: 0,
  imageHeight: 0,
  createdAt: undefined as string | undefined,
  updatedAt: undefined as string | undefined,
};

type ImageFormValues = typeof EMPTY_IMAGE;

const readFile = (file: File) =>
  new Promise<{ url: string; width: number; height: number }>(
    (resolve, reject) => {
      const reader = new FileReader();
      const image = new Image();

      reader.addEventListener('load', () => {
        image.src = reader.result as string;
      });
      reader.addEventListener('error', reject);
      image.addEventListener('load', () =>
        resolve({
          url: reader.result as string,
          width: image.width,
          height: image.height,
        })
      );
      image.addEventListener('error', reject);

      reader.readAsDataURL(file);
    }
  );

function ImageEditPanel({
  id,
  file,
  block,
  onClose,
  onSave,
  imageMetaData,
}: ImageEditPanelProps) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const [loadingError, setLoadingError] = useState<Error>();
  const [preparedFile, setPreparedFile] = useState<File>();

  const [updateImage, { loading: isUpdating, error: savingError }] =
    useMutation(UpdateImageDocument);

  const [uploadImage, { loading: isUploading, error: uploadError }] =
    useUploadImage();

  const isAuthorized = useAuthorisation(CanCreateImage.id);
  const isUpload = file !== undefined;

  const schema = z.object({
    filename: z.string(),
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    source: z.string(),
    link: z
      .union([
        z.literal(''),
        z.string().url(t('errorMessages.invalidUrlErrorMessage')),
      ])
      .nullish(),
    license: z.string(),
    focalPoint: z.custom<Point>(),
    imageBlock: z.custom<ImageBlockValue>().optional(),
    fileSize: z.number(),
    extension: z.string(),
    imageURL: z.string(),
    originalImageURL: z.string().optional(),
    imageWidth: z.number(),
    imageHeight: z.number(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isLoading },
  } = useForm<ImageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      if (file) {
        try {
          const prepared = await prepareImageForUpload(file);
          setPreparedFile(prepared);

          const [filename, ...extensions] = prepared.name.split('.');
          const { url, width, height } = await readFile(prepared);

          return {
            ...EMPTY_IMAGE,
            filename,
            extension: `.${extensions.join('.')}`,
            fileSize: prepared.size,
            imageURL: url,
            imageWidth: width,
            imageHeight: height,
            imageBlock: block,
            title: imageMetaData?.title ?? '',
            description: imageMetaData?.description ?? '',
            license: imageMetaData?.licence ?? '',
            link: imageMetaData?.link ?? '',
            source: imageMetaData?.source ?? '',
          };
        } catch (error) {
          setLoadingError(error as Error);

          return { ...EMPTY_IMAGE, imageBlock: block };
        }
      }

      if (!id) {
        return { ...EMPTY_IMAGE, imageBlock: block };
      }

      try {
        const { data } = await client.query({
          query: ImageDocument,
          variables: { id },
        });
        const image = data?.image;

        if (!image) {
          enqueueSnackbar(t('images.panels.notFound'), {
            variant: 'error',
            autoHideDuration: null,
          });

          return { ...EMPTY_IMAGE, imageBlock: block };
        }

        return {
          filename: image.filename || '',
          title: image.title ?? '',
          description: image.description ?? '',
          tags: image.tags,
          source: image.source ?? '',
          link: image.link ?? '',
          license: image.license ?? '',
          focalPoint: { x: image.focalPointX, y: image.focalPointY },
          imageBlock: block,
          fileSize: image.fileSize,
          extension: image.extension,
          imageURL: image.mediumURL ?? '',
          originalImageURL: image.url ?? '',
          imageWidth: image.width,
          imageHeight: image.height,
          createdAt: image.createdAt,
          updatedAt: image.modifiedAt,
        };
      } catch (error) {
        setLoadingError(error as Error);

        return { ...EMPTY_IMAGE, imageBlock: block };
      }
    },
  });

  const isDisabled = isLoading || isUpdating || isUploading || !isAuthorized;

  const imageBlock = useWatch({ control, name: 'imageBlock' });
  const filename = useWatch({ control, name: 'filename' });
  const extension = useWatch({ control, name: 'extension' });
  const fileSize = useWatch({ control, name: 'fileSize' });
  const imageURL = useWatch({ control, name: 'imageURL' });
  const originalImageURL = useWatch({ control, name: 'originalImageURL' });
  const imageWidth = useWatch({ control, name: 'imageWidth' });
  const imageHeight = useWatch({ control, name: 'imageHeight' });
  const createdAt = useWatch({ control, name: 'createdAt' });
  const updatedAt = useWatch({ control, name: 'updatedAt' });

  useEffect(() => {
    const error =
      loadingError?.message ?? savingError?.message ?? uploadError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [loadingError, savingError, uploadError]);

  async function handleSave(values: ImageFormValues) {
    const commonInput = {
      filename: values.filename || undefined,
      title: values.title || undefined,
      description: values.description || undefined,
      tags: values.tags,

      source: values.source || undefined,
      link: values.link || undefined,
      license: values.license || undefined,

      focalPointX: values.focalPoint?.x ?? 0.5,
      focalPointY: values.focalPoint?.y ?? 0.5,
    };

    if (file) {
      const uploadedImage = await uploadImage(
        preparedFile ?? file,
        commonInput
      );

      if (uploadedImage) {
        onSave?.(uploadedImage, values.imageBlock);
      }
    } else {
      const { data } = await updateImage({
        variables: { id: id!, ...commonInput },
      });

      enqueueSnackbar(t('images.panels.imageUpdated'), {
        variant: 'success',
        autoHideDuration: 2000,
      });

      if (data?.updateImage) {
        onSave?.(data.updateImage, values.imageBlock);
      }
    }
  }

  return (
    <DrawerForm onSubmit={handleSubmit(handleSave)}>
      <DrawerHeader>
        <DrawerTitle>
          {isUpload ?
            t('images.panels.uploadImage')
          : t('images.panels.editImage')}
        </DrawerTitle>

        <DrawerActions>
          <PermissionControl qualifyingPermissions={[CanCreateImage.id]}>
            <Button
              variant="contained"
              disabled={isDisabled}
              type="submit"
            >
              {isUpload ? t('images.panels.upload') : t('save')}
            </Button>
          </PermissionControl>

          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {isUpload ? t('images.panels.cancel') : t('images.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        {!isLoading && (
          <FormFields>
            <FormSectionTitle>
              {t('images.panels.focalPoint')}{' '}
              <InfoTooltip text={t('images.panels.focalPointInfo')} />
            </FormSectionTitle>

            {imageURL && imageWidth && imageHeight && (
              <Controller
                control={control}
                name="focalPoint"
                render={({ field }) => (
                  <FocalPointInput
                    imageURL={imageURL}
                    imageWidth={imageWidth}
                    imageHeight={imageHeight}
                    maxHeight={420}
                    focalPoint={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            )}

            <FormSectionTitle>
              {t('images.panels.description')}
            </FormSectionTitle>

            <DescriptionList>
              <DescriptionListItem label={t('images.panels.filename')}>
                {filename || t('images.panels.untitled')}
                {extension}
              </DescriptionListItem>

              <DescriptionListItem label={t('images.panels.dimension')}>
                {t('images.panels.imageDimension', {
                  imageWidth,
                  imageHeight,
                })}
              </DescriptionListItem>

              {createdAt && (
                <DescriptionListItem label={t('images.panels.created')}>
                  {t('images.panels.createdAt', {
                    createdAt: new Date(createdAt),
                  })}
                </DescriptionListItem>
              )}

              {updatedAt && (
                <DescriptionListItem label={t('images.panels.updated')}>
                  {t('images.panels.updatedAt', {
                    updatedAt: new Date(updatedAt),
                  })}
                </DescriptionListItem>
              )}

              <DescriptionListItem label={t('images.panels.fileSize')}>
                {prettyBytes(fileSize)}
              </DescriptionListItem>

              {originalImageURL && (
                <DescriptionListItem label={t('images.panels.link')}>
                  <Link
                    href={originalImageURL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('images.panels.openOriginal')}
                  </Link>
                </DescriptionListItem>
              )}
            </DescriptionList>

            <FormSectionTitle>
              {t('images.panels.information')}
            </FormSectionTitle>

            <Controller
              control={control}
              name="filename"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('images.panels.filename')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="title"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('images.panels.title')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={
                    <>
                      {t('images.panels.description')}{' '}
                      <InfoTooltip text={t('images.panels.descriptionInfo')} />
                    </>
                  }
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            {imageBlock && (
              <TextField
                name="linkUrl"
                label={
                  <>
                    {t('images.panels.linkUrl')}{' '}
                    <InfoTooltip text={t('images.panels.linkUrlInfo')} />
                  </>
                }
                value={imageBlock.linkUrl ?? ''}
                disabled={isDisabled}
                onChange={event =>
                  setValue('imageBlock', {
                    ...imageBlock,
                    linkUrl: event.target.value,
                  })
                }
                fullWidth
              />
            )}

            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <Autocomplete
                  multiple
                  freeSolo
                  disabled={isDisabled}
                  options={field.value}
                  value={field.value}
                  onChange={(_event, value) => field.onChange(value)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={t('images.panels.tags')}
                    />
                  )}
                  fullWidth
                />
              )}
            />

            <FormSectionTitle>
              {t('images.panels.attribution')}
            </FormSectionTitle>

            <Controller
              control={control}
              name="source"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('images.panels.source')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="link"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('images.panels.link')}
                  placeholder={t('images.panels.urlPlaceholder')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message ?? t('images.panels.sourceLink')}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="license"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('images.panels.license')}
                  disabled={isDisabled}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />
          </FormFields>
        )}
      </DrawerBody>
    </DrawerForm>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetImage.id,
  CanGetImages.id,
  CanDeleteImage.id,
  CanCreateImage.id,
])(ImageEditPanel);
export { CheckedPermissionComponent as ImageEditPanel };
