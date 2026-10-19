import { useState } from 'react';

import { AudioEditPanel } from './audioEditPanel';
import { AudioUploadPanel } from './audioUploadPanel';

export interface AudioUploadAndEditPanelProps {
  onClose(): void;
  onUpload(): void;
}

export function AudioUploadAndEditPanel({
  onClose,
  onUpload,
}: AudioUploadAndEditPanelProps) {
  const [file, setFile] = useState<File | null>(null);

  return file ?
      <AudioEditPanel
        file={file}
        onClose={onClose}
        onReplace={() => setFile(null)}
        onSave={onUpload}
      />
    : <AudioUploadPanel
        onClose={onClose}
        onUpload={setFile}
      />;
}
