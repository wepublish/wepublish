import { useState } from 'react';

import { VideoEditPanel } from './videoEditPanel';
import { VideoUploadPanel } from './videoUploadPanel';

export interface VideoUploadAndEditPanelProps {
  onClose(): void;
  onUpload(): void;
}

export function VideoUploadAndEditPanel({
  onClose,
  onUpload,
}: VideoUploadAndEditPanelProps) {
  const [file, setFile] = useState<File | null>(null);

  return file ?
      <VideoEditPanel
        file={file}
        onClose={onClose}
        onSave={onUpload}
      />
    : <VideoUploadPanel
        onClose={onClose}
        onUpload={setFile}
      />;
}
