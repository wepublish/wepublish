import styled from '@emotion/styled';
import {
  FullImageFragment,
  getApiClientV2,
  ImageListDocument,
  useImageQuery,
  useUpdateImageMutation,
  useUploadImageMutation,
} from '@wepublish/editor/api-v2';
import imageCompression from 'browser-image-compression';
import prettyBytes from 'pretty-bytes';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Drawer,
  Form as RForm,
  Message,
  Panel as RPanel,
  Schema,
  TagPicker,
  toaster,
} from 'rsuite';

import { DescriptionList, DescriptionListItem } from '../atoms/descriptionList';
import { Point } from '../atoms/draggable';
import { FocalPointInput } from '../atoms/focalPointInput';
import { ImageMetaData } from '../atoms/imageMetaData';
import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms/permissionControl';
import { ImageBlockValue } from '../blocks';
import {
  getImgMinSizeToCompress,
  getOperationNameFromDocument,
} from '../utility';

const { ControlLabel, Control, Group } = RForm;

const Panel = styled(RPanel)`
  background-color: dark;
`;

const Form = styled(RForm)`
  height: 100%;
`;

export interface ImageEditPanelProps {
  readonly block?: ImageBlockValue;
  readonly id?: string;
  readonly file?: File;
  readonly imageMetaData?: ImageMetaData;

  onClose?(): void;
  onSave?(image: FullImageFragment, block: ImageBlockValue | undefined): void;
}

function ImageEditPanel({
  id,
  file,
  block,
  onClose,
  onSave,
  imageMetaData,
}: ImageEditPanelProps) {
  const [imageBlock, setImageBlock] = useState<ImageBlockValue | undefined>(
    block
  );

  const [filename, setFilename] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [source, setSource] = useState('');
  const [link, setLink] = useState('');
  const [license, setLicense] = useState('');

  const [fileSize, setFileSize] = useState(0);
  const [extension, setExtension] = useState('');

  const [originalImageURL, setOriginalImageURL] = useState<string>();

  const [imageURL, setImageURL] = useState('');
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  const [createdAt, setCreatedAt] = useState<string>();
  const [updatedAt, setUpdatedAt] = useState<string>();

  const [focalPoint, setFocalPoint] = useState<Point>();

  const client = getApiClientV2();
  const { data, error: loadingError } = useImageQuery({
    client,
    variables: { id: id! },
    fetchPolicy: 'network-only',
    skip: id === undefined,
  });

  const [updateImage, { loading: isUpdating, error: savingError }] =
    useUpdateImageMutation({ client });

  const [uploadImage, { loading: isUploading, error: uploadError }] =
    useUploadImageMutation({
      client,
      refetchQueries: [getOperationNameFromDocument(ImageListDocument)],
    });

  const [isLoading, setLoading] = useState(true);
  const isAuthorized = useAuthorisation('CAN_CREATE_IMAGE');
  const isDisabled = isLoading || isUpdating || isUploading || !isAuthorized;
  const isUpload = file !== undefined;
  const { t } = useTranslation();

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      const [filename, ...extensions] = file.name.split('.');
      const extension = `.${extensions.join('.')}`;
      const image = new Image();

      const handleReaderLoad = function () {
        image.src = reader.result as string;
      };

      const handleImageLoad = function () {
        setCreatedAt(undefined);
        setUpdatedAt(undefined);

        setFilename(filename);
        setFileSize(file!.size);
        setExtension(extension);

        setOriginalImageURL(undefined);
        setImageURL(reader.result as string);
        setImageWidth(image.width);
        setImageHeight(image.height);
        setFocalPoint({ x: 0.5, y: 0.5 });

        if (imageMetaData) {
          setTitle(imageMetaData.title);
          setDescription(imageMetaData.description);
          setLicense(imageMetaData.licence);
          setLink(imageMetaData.link);
          setSource(imageMetaData.source);
        }

        setLoading(false);
      };

      reader.addEventListener('load', handleReaderLoad);
      image.addEventListener('load', handleImageLoad);

      reader.readAsDataURL(file);

      return () => {
        reader.removeEventListener('load', handleReaderLoad);
        image.removeEventListener('load', handleImageLoad);
      };
    } else if (data) {
      const { image } = data;

      if (image) {
        setCreatedAt(image.createdAt);
        setUpdatedAt(image.modifiedAt);

        setFilename(image.filename || '');
        setFileSize(image.fileSize);
        setExtension(image.extension);

        setTitle(image.title ?? '');
        setDescription(image.description ?? '');
        setTags(image.tags);

        setSource(image.source ?? '');
        setLink(image.link ?? '');
        setLicense(image.license ?? '');

        setOriginalImageURL(image.url ?? '');
        setImageURL(image.mediumURL ?? '');
        setImageWidth(image.width);
        setImageHeight(image.height);
        setFocalPoint(image.focalPoint ?? undefined);
        setLoading(false);
      } else {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
            duration={0}
          >
            {t('images.panels.notFound')}
          </Message>
        );
      }
    }

    return () => {
      /* do nothing */
    };
  }, [file, data]);

  useEffect(() => {
    const error =
      loadingError?.message ?? savingError?.message ?? uploadError?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
  }, [loadingError, savingError, uploadError]);

  async function handleSave() {
    const commonInput = {
      filename: filename || undefined,
      title: title || undefined,
      description: description || undefined,
      tags,

      source: source || undefined,
      link: link || undefined,
      license: license || undefined,

      focalPoint,
    };

    if (isUpload) {
      const optimizedImage: File = await resizeImage(file!);
      const { data } = await uploadImage({
        variables: {
          file: optimizedImage!,
          ...commonInput,
        },
      });

      if (data?.uploadImage) {
        onSave?.(data.uploadImage, imageBlock);
      }
    } else {
      const { data } = await updateImage({
        variables: { id: id!, ...commonInput },
      });

      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={2000}
        >
          {t('images.panels.imageUpdated')}
        </Message>
      );

      if (data?.updateImage) {
        onSave?.(data.updateImage, imageBlock);
      }
    }
  }

  /**
   * Resizes an image on client side, if larger than the IMG_MIN_SIZE_TO_COMPRESS env variable
   * @param file
   */
  async function resizeImage(file: File): Promise<File> {
    const imgMinSizeToCompress: number = getImgMinSizeToCompress();
    // only resize image if larger than IMG_MIN_SIZE_TO_COMPRESS env variable
    // ATTENTION: The MAX_UPLOAD_SIZE of the Media server must allow images of this size
    if (!willImageResize(file, imgMinSizeToCompress)) {
      return file; // do not resize
    }
    const options = {
      maxSizeMB: imgMinSizeToCompress, // the max size in MB, defaults to 2MB
    };
    return imageCompression(file, options);
  }

  /**
   * Decide whether an image will be automatically resized or not. The limit is given by the
   * IMG_MIN_SIZE_TO_COMPRESS env variable
   * @param file
   * @param imgMinSizeToResize
   */
  function willImageResize(file: File, imgMinSizeToResize: number) {
    const originalFileSize: number = file.size / (1024 * 1024);
    if (originalFileSize > imgMinSizeToResize) {
      return true;
    }
    return false;
  }

  // Schema used for form validation
  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    link: StringType().isURL(t('errorMessages.invalidUrlErrorMessage')),
  });

  return (
    <Form
      fluid
      model={validationModel}
      onSubmit={validationPassed => validationPassed && handleSave()}
    >
      <Drawer.Header>
        <Drawer.Title>
          {isUpload ?
            t('images.panels.uploadImage')
          : t('images.panels.editImage')}
        </Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_IMAGE']}>
            <Button
              appearance={'primary'}
              disabled={isDisabled}
              type="submit"
            >
              {isUpload ? t('images.panels.upload') : t('save')}
            </Button>
          </PermissionControl>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {isUpload ? t('images.panels.cancel') : t('images.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        {!isLoading && (
          <>
            <Panel>
              {imageURL && imageWidth && imageHeight && (
                <FocalPointInput
                  imageURL={imageURL}
                  imageWidth={imageWidth}
                  imageHeight={imageHeight}
                  maxHeight={300}
                  focalPoint={focalPoint}
                  onChange={point => setFocalPoint(point)}
                />
              )}
            </Panel>
            <RPanel header={t('images.panels.description')}>
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

                <DescriptionListItem label={t('images.panels.fileSize')}>
                  {prettyBytes(fileSize)}
                </DescriptionListItem>

                {originalImageURL && (
                  <DescriptionListItem label={t('images.panels.link')}>
                    <a
                      href={originalImageURL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {originalImageURL}
                    </a>
                  </DescriptionListItem>
                )}
              </DescriptionList>
            </RPanel>
            <RPanel header={t('images.panels.information')}>
              <Group controlId="imageFilename">
                <ControlLabel>{t('images.panels.filename')}</ControlLabel>
                <Control
                  name="filename"
                  value={filename}
                  disabled={isDisabled}
                  onChange={(value: string) => setFilename(value)}
                />
              </Group>
              <Group controlId="imageTitle">
                <ControlLabel>{t('images.panels.title')}</ControlLabel>
                <Control
                  name="title"
                  value={title}
                  disabled={isDisabled}
                  onChange={(value: string) => setTitle(value)}
                />
              </Group>
              <Group controlId="imageDescription">
                <ControlLabel>{t('images.panels.description')}</ControlLabel>
                <Control
                  name="description"
                  value={description}
                  disabled={isDisabled}
                  onChange={(value: string) => setDescription(value)}
                />
              </Group>
              {imageBlock && (
                <Group controlId="imageLinkUrl">
                  <ControlLabel>{t('images.panels.linkUrl')}</ControlLabel>
                  <Control
                    name="linkUrl"
                    value={imageBlock.linkUrl}
                    disabled={isDisabled}
                    onChange={(value: string) =>
                      setImageBlock({ ...imageBlock, linkUrl: value })
                    }
                  />
                </Group>
              )}
              <Group controlId="imageTags">
                <ControlLabel>{t('images.panels.tags')}</ControlLabel>
                <TagPicker
                  virtualized
                  block
                  creatable
                  disabled={isDisabled}
                  value={tags}
                  data={tags.map(tag => ({ value: tag, label: tag }))}
                  onChange={value => setTags(value ?? [])}
                />
              </Group>
            </RPanel>
            <RPanel header={t('images.panels.attribution')}>
              <Group controlId="imageSource">
                <ControlLabel>{t('images.panels.source')}</ControlLabel>
                <Control
                  name="source"
                  value={source}
                  disabled={isDisabled}
                  onChange={(value: string) => setSource(value)}
                />
              </Group>
              <Group controlId="imageLink">
                <ControlLabel>{t('images.panels.link')}</ControlLabel>
                <Control
                  name="link"
                  value={link}
                  placeholder={t('images.panels.urlPlaceholder')}
                  disabled={isDisabled}
                  onChange={(value: string) => setLink(value)}
                />
                <p>{t('images.panels.sourceLink')}</p>
              </Group>
              <Group controlId="imageLicense">
                <ControlLabel>{t('images.panels.license')}</ControlLabel>
                <Control
                  name="license"
                  value={license}
                  disabled={isDisabled}
                  onChange={(value: string) => setLicense(value)}
                />
              </Group>
            </RPanel>
          </>
        )}
      </Drawer.Body>
    </Form>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_IMAGE',
  'CAN_GET_IMAGES',
  'CAN_DELETE_IMAGE',
  'CAN_CREATE_IMAGE',
])(ImageEditPanel);
export { CheckedPermissionComponent as ImageEditPanel };
