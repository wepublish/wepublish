import { useQuery } from '@apollo/client/react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CircularProgress, Drawer, Tooltip } from '@mui/material';
import { FieldLabel, FieldProps, useGetPuck } from '@puckeditor/core';
import { ImageDocument } from '@wepublish/editor/api';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  ImageEditPanel,
  ImageMultiSelectPanel,
  ImageSelectPanel,
  ImageUpload,
  UploadedAfterUnmount,
  useImageUploadQueue,
} from '@wepublish/ui/editor';
import {
  DragEvent,
  ReactNode,
  Ref,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAddPhotoAlternate,
  MdClose,
  MdDragIndicator,
  MdEdit,
  MdErrorOutline,
  MdFileUpload,
  MdImage,
  MdRefresh,
} from 'react-icons/md';

import {
  appendImageIds,
  attachUploadedImage,
  canAddImages,
  ImageField,
  ImageListTarget,
  imageSortKeys,
  ImageValue,
  moveImageId,
  removeImageIdAt,
} from './image.field';
import {
  ImageAddTile,
  ImageMultiPickerFooter,
  ImageMultiPickerWrapper,
  ImageTile,
  ImageTileActions,
  ImageTileButton,
  ImageTileDragHandle,
  ImageTileGrid,
  ImageTileOverlay,
  ImageTilePlaceholder,
  VisuallyHidden,
} from './image.styles';

const IMAGE_HEIGHT = 180;

const drawerSlotProps = {
  paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
};

const wideDrawerSlotProps = {
  paper: { sx: { width: DRAWER_WIDTHS.md, maxWidth: '100vw' } },
};

const ImageSelectDrawer = ({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}) => (
  <Drawer
    anchor="right"
    slotProps={drawerSlotProps}
    open={open}
    onClose={onClose}
  >
    <ImageSelectPanel
      onClose={onClose}
      onSelect={selected => {
        onClose();
        onSelect(selected.id);
      }}
    />
  </Drawer>
);

const ImageEditDrawer = ({
  id,
  open,
  onClose,
}: {
  id: string | undefined;
  open: boolean;
  onClose: () => void;
}) => (
  <Drawer
    anchor="right"
    slotProps={drawerSlotProps}
    open={open && !!id}
    onClose={onClose}
  >
    {id && (
      <ImageEditPanel
        id={id}
        onClose={onClose}
        onSave={onClose}
      />
    )}
  </Drawer>
);

export type ImagePickerProps = {
  value: ImageValue | undefined;
  onChange: (value: ImageValue | undefined) => void;
  readOnly?: boolean;
};

export const ImagePicker = ({
  value,
  onChange,
  readOnly,
}: ImagePickerProps) => {
  const [chooseOpen, setChooseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data, loading } = useQuery(ImageDocument, {
    variables: { id: value ?? '' },
    skip: !value,
  });
  const image = value ? data?.image : undefined;

  return (
    <>
      <ChooseEditImage
        image={image}
        disabled={!!readOnly || loading}
        maxHeight={IMAGE_HEIGHT}
        openChooseModalOpen={() => setChooseOpen(true)}
        openEditModalOpen={image ? () => setEditOpen(true) : undefined}
        removeImage={() => onChange(undefined)}
        onSelect={selected => onChange(selected.id)}
      />

      <ImageSelectDrawer
        open={chooseOpen}
        onClose={() => setChooseOpen(false)}
        onSelect={onChange}
      />

      <ImageEditDrawer
        id={image?.id}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
};

const IconAction = ({
  label,
  onClick,
  buttonRef,
  children,
}: {
  label: string;
  onClick: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
  children: ReactNode;
}) => (
  <Tooltip
    title={label}
    disableInteractive
  >
    <ImageTileButton
      ref={buttonRef}
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </ImageTileButton>
  </Tooltip>
);

type SortableImageTileProps = {
  sortKey: string;
  id: ImageValue;
  readOnly?: boolean;
  removeRef?: Ref<HTMLButtonElement>;
  onEdit: () => void;
  onRemove: () => void;
};

const SortableImageTile = ({
  sortKey,
  id,
  readOnly,
  removeRef,
  onEdit,
  onRemove,
}: SortableImageTileProps) => {
  const { t } = useTranslation();
  const { data } = useQuery(ImageDocument, { variables: { id } });
  const image = data?.image;
  const title = image?.title || t('', 'Untitled image');
  const source =
    image?.squareURL ?? image?.thumbURL ?? image?.mediumURL ?? image?.url;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortKey, disabled: readOnly });

  return (
    <ImageTile
      ref={setNodeRef}
      data-dragging={isDragging}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {source ?
        <img
          src={source}
          alt={title}
        />
      : <ImageTilePlaceholder>
          <MdImage aria-hidden />
        </ImageTilePlaceholder>
      }

      {!readOnly && (
        <>
          <ImageTileDragHandle
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label={t('', 'Move {{title}}', { title })}
          >
            <MdDragIndicator />
          </ImageTileDragHandle>

          <ImageTileActions>
            <IconAction
              label={t('', 'Edit {{title}}', { title })}
              onClick={onEdit}
            >
              <MdEdit />
            </IconAction>

            <IconAction
              label={t('', 'Remove {{title}}', { title })}
              buttonRef={removeRef}
              onClick={onRemove}
            >
              <MdClose />
            </IconAction>
          </ImageTileActions>
        </>
      )}
    </ImageTile>
  );
};

type UploadTileProps = {
  upload: ImageUpload;
  tileRef?: Ref<HTMLDivElement>;
  onRetry: () => void;
  onDismiss: () => void;
};

const UploadTile = ({
  upload,
  tileRef,
  onRetry,
  onDismiss,
}: UploadTileProps) => {
  const { t } = useTranslation();
  const { file, status, previewUrl, canRetry, errorMessage } = upload;
  const failed = status === 'failed';
  const statusText =
    failed ? (errorMessage ?? t('', 'Upload failed')) : t('', 'Uploading…');

  return (
    <ImageTile
      ref={tileRef}
      tabIndex={-1}
      data-status={status}
      title={`${file.name}: ${statusText}`}
    >
      {previewUrl && (
        <img
          src={previewUrl}
          alt=""
        />
      )}

      <ImageTileOverlay
        data-status={status}
        aria-hidden
      >
        {failed ?
          <MdErrorOutline />
        : <CircularProgress
            size={20}
            color="inherit"
          />
        }
      </ImageTileOverlay>

      <VisuallyHidden>{`${file.name}: ${statusText}`}</VisuallyHidden>

      {failed && (
        <ImageTileActions>
          {canRetry && (
            <IconAction
              label={t('', 'Retry {{name}}', { name: file.name })}
              onClick={onRetry}
            >
              <MdRefresh />
            </IconAction>
          )}

          <IconAction
            label={t('', 'Dismiss {{name}}', { name: file.name })}
            onClick={onDismiss}
          >
            <MdClose />
          </IconAction>
        </ImageTileActions>
      )}
    </ImageTile>
  );
};

const carriesFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');

const trackElement = <T,>(
  elements: Map<string, T>,
  key: string,
  element: T | null
) => {
  if (element) {
    elements.set(key, element);
  } else {
    elements.delete(key);
  }
};

const neighbours = <T,>(
  elements: Map<string, T>,
  keys: string[],
  index: number
) =>
  [keys[index], keys[index - 1]].map(key =>
    key === undefined ? undefined : elements.get(key)
  );

const focusFirst = (candidates: (HTMLElement | null | undefined)[]) =>
  candidates
    .find(element => element?.isConnected && !element.hasAttribute('disabled'))
    ?.focus();

type PendingFocus = {
  list: 'images' | 'uploads';
  index: number;
  from: string;
};

export type ImageMultiPickerProps = {
  value: ImageValue[];
  onChange: (value: ImageValue[]) => void;
  readOnly?: boolean;
  max?: number;
  label?: string;
  uploadTarget?: ImageListTarget;
};

export const ImageMultiPicker = ({
  value,
  onChange,
  readOnly,
  max,
  label,
  uploadTarget,
}: ImageMultiPickerProps) => {
  const { t } = useTranslation();
  const getPuck = useGetPuck();
  const [chooseOpen, setChooseOpen] = useState(false);
  const [editId, setEditId] = useState<ImageValue>();
  const [editOpen, setEditOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const addImagesTile = useRef<HTMLButtonElement>(null);
  const uploadFilesTile = useRef<HTMLButtonElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const uploadTiles = useRef(new Map<string, HTMLDivElement>());
  const pendingFocus = useRef<PendingFocus | undefined>(undefined);
  const latestValue = useRef(value);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  const commit = (next: ImageValue[]) => {
    latestValue.current = next;
    onChange(next);
  };

  const { uploads, enqueue, retry, remove } = useImageUploadQueue({
    onUploaded: (image, key) => {
      remove(key);
      setUploadedCount(count => count + 1);
      commit(appendImageIds(latestValue.current, [image.id], max));
    },
  });

  const pendingUploads = uploads.filter(
    ({ status }) => status === 'queued' || status === 'uploading'
  ).length;
  const failedUploads = uploads.filter(({ status }) => status === 'failed');
  const finishedUploads = uploadedCount + failedUploads.length;
  const canAdd = !readOnly && canAddImages(value, max);
  const keys = imageSortKeys(value);
  const uploadKeys = uploads.map(({ key }) => key);
  const imageKeyList = keys.join('\n');
  const uploadKeyList = uploadKeys.join('\n');

  const uploadStatus =
    pendingUploads > 0 ?
      t('', 'Uploading images: {{finished}} of {{total}} finished.', {
        finished: finishedUploads,
        total: finishedUploads + pendingUploads,
      })
    : [
        uploadedCount > 0 &&
          t('', 'Images uploaded: {{uploaded}}.', { uploaded: uploadedCount }),
        failedUploads.length > 0 &&
          t('', 'Uploads failed: {{failed}}.', {
            failed: failedUploads.length,
          }),
        ...failedUploads.map(
          ({ file, errorMessage }) =>
            `${file.name}: ${errorMessage ?? t('', 'Upload failed')}`
        ),
      ]
        .filter(Boolean)
        .join(' ');

  useLayoutEffect(() => {
    const pending = pendingFocus.current;

    if (
      !pending ||
      (pending.list === 'images' ? imageKeyList : uploadKeyList) ===
        pending.from
    ) {
      return;
    }

    pendingFocus.current = undefined;

    focusFirst(
      pending.list === 'images' ?
        [
          ...neighbours(removeButtons.current, keys, pending.index),
          addImagesTile.current,
          uploadFilesTile.current,
        ]
      : [
          ...neighbours(uploadTiles.current, uploadKeys, pending.index),
          uploadFilesTile.current,
          addImagesTile.current,
          removeButtons.current.get(keys[keys.length - 1]),
        ]
    );
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const attachAfterUnmount = (): UploadedAfterUnmount | undefined => {
    const itemId = getPuck().selectedItem?.props.id;

    if (!uploadTarget || !itemId) {
      return undefined;
    }

    return image => {
      const puck = getPuck();
      const action = attachUploadedImage(
        puck,
        itemId,
        uploadTarget,
        image.id,
        max
      );

      if (action) {
        puck.dispatch(action);
      }
    };
  };

  const upload = (files: File[]) => {
    const room =
      max === undefined ? files.length : max - value.length - pendingUploads;

    if (room > 0 && files.length > 0) {
      if (pendingUploads === 0) {
        setUploadedCount(0);
      }

      enqueue(files.slice(0, room), attachAfterUnmount());
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const from = keys.indexOf(String(active.id));
    const to = keys.indexOf(String(over.id));

    if (from < 0 || to < 0) {
      return;
    }

    commit(moveImageId(value, from, to));
  };

  const handleDrop = (event: DragEvent) => {
    if (!carriesFiles(event)) {
      return;
    }

    event.preventDefault();
    setDragging(false);

    if (canAdd) {
      upload(Array.from(event.dataTransfer.files));
    }
  };

  return (
    <>
      <ImageMultiPickerWrapper
        role="group"
        aria-label={label ?? t('', 'Images')}
        data-dragging={dragging && canAdd}
        onDragOver={event => {
          if (carriesFiles(event) && canAdd) {
            event.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={event => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            setDragging(false);
          }
        }}
        onDrop={handleDrop}
      >
        <ImageTileGrid>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={keys}
              strategy={rectSortingStrategy}
            >
              {value.map((id, index) => (
                <SortableImageTile
                  key={keys[index]}
                  sortKey={keys[index]}
                  id={id}
                  readOnly={readOnly}
                  removeRef={element =>
                    trackElement(removeButtons.current, keys[index], element)
                  }
                  onEdit={() => {
                    setEditId(id);
                    setEditOpen(true);
                  }}
                  onRemove={() => {
                    pendingFocus.current = {
                      list: 'images',
                      index,
                      from: imageKeyList,
                    };
                    commit(removeImageIdAt(value, index));
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>

          {uploads.map((item, index) => (
            <UploadTile
              key={item.key}
              upload={item}
              tileRef={element =>
                trackElement(uploadTiles.current, item.key, element)
              }
              onRetry={() => {
                uploadTiles.current.get(item.key)?.focus();
                retry(item.key);
              }}
              onDismiss={() => {
                pendingFocus.current = {
                  list: 'uploads',
                  index,
                  from: uploadKeyList,
                };

                if (pendingUploads === 0) {
                  setUploadedCount(0);
                }

                remove(item.key);
              }}
            />
          ))}

          {!readOnly && (
            <>
              <ImageAddTile
                ref={addImagesTile}
                type="button"
                disabled={!canAdd}
                onClick={() => setChooseOpen(true)}
              >
                <MdAddPhotoAlternate aria-hidden />
                {t('', 'Add images')}
              </ImageAddTile>

              <ImageAddTile
                ref={uploadFilesTile}
                type="button"
                disabled={!canAdd}
                onClick={() => fileInput.current?.click()}
              >
                <MdFileUpload aria-hidden />
                {t('', 'Upload')}
              </ImageAddTile>
            </>
          )}
        </ImageTileGrid>

        {(!readOnly || max !== undefined) && (
          <ImageMultiPickerFooter>
            <span>
              {readOnly ? null : t('', 'Drop images here to upload them.')}
            </span>
            {max !== undefined && <span>{`${value.length} / ${max}`}</span>}
          </ImageMultiPickerFooter>
        )}

        <VisuallyHidden role="status">{uploadStatus}</VisuallyHidden>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          aria-label={t('', 'Upload images')}
          value=""
          onChange={event => upload(Array.from(event.target.files ?? []))}
        />
      </ImageMultiPickerWrapper>

      <Drawer
        anchor="right"
        slotProps={wideDrawerSlotProps}
        open={chooseOpen}
        onClose={() => setChooseOpen(false)}
      >
        <ImageMultiSelectPanel
          selectedIds={value}
          max={max}
          onClose={() => setChooseOpen(false)}
          onConfirm={ids => {
            setChooseOpen(false);
            commit(ids);
          }}
        />
      </Drawer>

      <ImageEditDrawer
        id={editId}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
};

export type ImageFieldRenderProps = FieldProps<
  ImageField,
  ImageValue | undefined
>;

export const ImageFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: ImageFieldRenderProps) => {
  const { t } = useTranslation();

  return (
    <FieldLabel
      label={field.label ?? t('', 'Image')}
      readOnly={readOnly}
      el="div"
    >
      <ImagePicker
        value={value}
        onChange={onChange}
        readOnly={readOnly}
      />
    </FieldLabel>
  );
};
