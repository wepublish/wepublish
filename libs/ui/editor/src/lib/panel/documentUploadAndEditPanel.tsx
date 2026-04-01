import { useState } from 'react';

import { DocumentEditPanel } from './documentEditPanel';
import { DocumentUploadPanel } from './documentUploadPanel';

export interface DocumentUploadAndEditPanelProps {
  onClose(): void;
  onUpload(): void;
}

export function DocumentUploadAndEditPanel({
  onClose,
  onUpload,
}: DocumentUploadAndEditPanelProps) {
  const [file, setFile] = useState<File | null>(null);

  return file ?
      <DocumentEditPanel
        file={file}
        onClose={onClose}
        onSave={onUpload}
      />
    : <DocumentUploadPanel
        onClose={onClose}
        onUpload={setFile}
      />;
}
