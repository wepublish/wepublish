import {
  FullImageFragment,
  UploadImageMutationVariables,
} from '@wepublish/editor/api';

import { ImageMetaData } from './imageMetaData';

export type ImageUploadStatus = 'queued' | 'uploading' | 'done' | 'failed';

export type ImageUpload = {
  key: string;
  file: File;
  status: ImageUploadStatus;
  canRetry: boolean;
  previewUrl?: string;
  image?: FullImageFragment;
  errorMessage?: string;
};

export type ImageUploadDetails = Omit<UploadImageMutationVariables, 'file'>;

export type TaskQueue<Task> = {
  push: (...tasks: Task[]) => void;
};

export const createTaskQueue = <Task>(
  concurrency: number,
  run: (task: Task) => Promise<unknown>
): TaskQueue<Task> => {
  const pending: Task[] = [];
  let active = 0;

  const startNext = () => {
    while (active < concurrency && pending.length > 0) {
      const [task] = pending.splice(0, 1);
      const settle = () => {
        active -= 1;
        startNext();
      };

      active += 1;
      run(task).then(settle, settle);
    }
  };

  return {
    push: (...tasks) => {
      pending.push(...tasks);
      startNext();
    },
  };
};

export const isImageFile = (file: File) => file.type.startsWith('image/');

export const isFinishedImageUpload = ({ status }: ImageUpload) =>
  status === 'done' || status === 'failed';

const withoutExtension = (name: string) => name.replace(/\.[^.]+$/, '');

export const imageUploadDetails = (
  file: File,
  metaData: ImageMetaData
): ImageUploadDetails => ({
  filename: withoutExtension(file.name) || undefined,
  title: metaData['title'] || undefined,
  description: metaData['description'] || undefined,
  source: metaData['source'] || undefined,
  link: metaData['link'] || undefined,
  license: metaData['licence'] || undefined,
  tags: [],
  focalPointX: 0.5,
  focalPointY: 0.5,
});

export const updateImageUpload = (
  uploads: ImageUpload[],
  key: string,
  changes: Partial<Omit<ImageUpload, 'key'>>
) =>
  uploads.map(upload =>
    upload.key === key ? { ...upload, ...changes } : upload
  );
