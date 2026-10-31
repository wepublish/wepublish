import { useMutation } from '@apollo/client/react';
import {
  FullImageFragment,
  ImageListDocument,
  UploadImageDocument,
} from '@wepublish/editor/api';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { humanizeError } from '../humanizeError';
import {
  compressImageForUpload,
  getOperationNameFromDocument,
} from '../utility';
import { readImageMetaData } from './imageMetaData';
import {
  createTaskQueue,
  ImageUpload,
  ImageUploadDetails,
  imageUploadDetails,
  isFinishedImageUpload,
  isImageFile,
  TaskQueue,
  updateImageUpload,
} from './imageUploadQueue';
import {
  isSupportedImage,
  prepareImageForUpload,
} from './prepareImageForUpload';

export function useUploadImage() {
  const [uploadImage, result] = useMutation(UploadImageDocument, {
    refetchQueries: [getOperationNameFromDocument(ImageListDocument)],
  });

  const upload = async (
    file: File,
    details: ImageUploadDetails
  ): Promise<FullImageFragment | undefined> => {
    const { data } = await uploadImage({
      variables: { ...details, file: await compressImageForUpload(file) },
    });

    return data?.uploadImage;
  };

  return [upload, result] as const;
}

export type UseImageUploadQueueOptions = {
  concurrency?: number;
  onUploaded?: (image: FullImageFragment, key: string) => void;
};

export type UploadedAfterUnmount = (image: FullImageFragment) => void;

export type ImageUploadQueue = {
  uploads: ImageUpload[];
  enqueue: (
    files: File[],
    onUploadedAfterUnmount?: UploadedAfterUnmount
  ) => void;
  retry: (key: string) => void;
  remove: (key: string) => void;
  clearFinished: () => void;
};

type UploadTask = Pick<ImageUpload, 'key' | 'file'>;

type UploadChanges = Partial<Omit<ImageUpload, 'key'>>;

const createPreviewUrl = (file: File) =>
  typeof URL.createObjectURL === 'function' ?
    URL.createObjectURL(file)
  : undefined;

const revokePreviewUrl = (url: string) => {
  if (typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
};

export function useImageUploadQueue({
  concurrency = 2,
  onUploaded,
}: UseImageUploadQueueOptions = {}): ImageUploadQueue {
  const { t } = useTranslation();
  const [uploads, setUploads] = useState<ImageUpload[]>([]);
  const [upload] = useUploadImage();
  const nextKey = useRef(0);
  const queue = useRef<TaskQueue<UploadTask> | null>(null);
  const previews = useRef(new Map<string, string>());
  const afterUnmount = useRef(new Map<string, UploadedAfterUnmount>());
  const mounted = useRef(false);
  const latest = useRef({ upload, onUploaded, t });

  useEffect(() => {
    latest.current = { upload, onUploaded, t };
  });

  useEffect(() => {
    const urls = previews.current;
    mounted.current = true;

    return () => {
      mounted.current = false;
      urls.forEach(revokePreviewUrl);
      urls.clear();
    };
  }, []);

  const updateUploads = (update: (current: ImageUpload[]) => ImageUpload[]) => {
    if (mounted.current) {
      setUploads(update);
    }
  };

  const change = (key: string, changes: UploadChanges) =>
    updateUploads(current => updateImageUpload(current, key, changes));

  const fail = (key: string, changes: UploadChanges) =>
    change(key, { ...changes, status: 'failed' });

  const run = async ({ key, file }: UploadTask) => {
    change(key, { status: 'uploading', errorMessage: undefined });

    let image: FullImageFragment | undefined;

    try {
      const prepared = await prepareImageForUpload(file);

      if (!isSupportedImage(prepared)) {
        fail(key, {
          canRetry: false,
          errorMessage: latest.current.t('images.panels.unsupportedImage'),
        });

        return;
      }

      const metaData = await readImageMetaData(file);
      image = await latest.current.upload(
        prepared,
        imageUploadDetails(prepared, metaData)
      );
    } catch (error) {
      fail(key, { errorMessage: humanizeError(error) });

      return;
    }

    if (!image) {
      fail(key, { errorMessage: humanizeError(undefined) });

      return;
    }

    change(key, { status: 'done', image });

    const orphaned = afterUnmount.current.get(key);
    afterUnmount.current.delete(key);

    if (mounted.current) {
      latest.current.onUploaded?.(image, key);
    } else {
      orphaned?.(image);
    }
  };

  const startUploads = (tasks: UploadTask[]) => {
    queue.current ??= createTaskQueue(concurrency, run);
    queue.current.push(...tasks);
  };

  const release = (key: string) => {
    const url = previews.current.get(key);

    if (url) {
      revokePreviewUrl(url);
      previews.current.delete(key);
    }
  };

  const enqueue = (
    files: File[],
    onUploadedAfterUnmount?: UploadedAfterUnmount
  ) => {
    const added = files.map((file): ImageUpload => {
      nextKey.current += 1;
      const key = `image-upload-${nextKey.current}`;

      if (!isImageFile(file)) {
        return {
          key,
          file,
          status: 'failed',
          canRetry: false,
          errorMessage: t('articleEditor.panels.invalidImage'),
        };
      }

      const previewUrl = createPreviewUrl(file);

      if (previewUrl) {
        previews.current.set(key, previewUrl);
      }

      return { key, file, status: 'queued', canRetry: true, previewUrl };
    });

    const queued = added.filter(({ status }) => status === 'queued');

    if (onUploadedAfterUnmount) {
      queued.forEach(({ key }) =>
        afterUnmount.current.set(key, onUploadedAfterUnmount)
      );
    }

    setUploads(current => [...current, ...added]);
    startUploads(queued.map(({ key, file }) => ({ key, file })));
  };

  const retry = (key: string) => {
    const failed = uploads.find(
      upload => upload.key === key && upload.status === 'failed'
    );

    if (!failed?.canRetry) {
      return;
    }

    change(key, { status: 'queued', errorMessage: undefined });
    startUploads([{ key, file: failed.file }]);
  };

  const remove = (key: string) => {
    release(key);
    afterUnmount.current.delete(key);
    setUploads(current => current.filter(upload => upload.key !== key));
  };

  const clearFinished = () => {
    uploads.filter(isFinishedImageUpload).forEach(({ key }) => release(key));
    setUploads(current =>
      current.filter(upload => !isFinishedImageUpload(upload))
    );
  };

  return { uploads, enqueue, retry, remove, clearFinished };
}
