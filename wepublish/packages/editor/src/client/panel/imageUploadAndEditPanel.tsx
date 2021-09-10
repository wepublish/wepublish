import React, {useState} from 'react'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageUploadPanel} from './imageUploadPanel'

export interface ImageUploadAndEditPanelProps {
  onClose(): void
  onUpload(): void
}

export function ImageUploadAndEditPanel({onClose, onUpload}: ImageUploadAndEditPanelProps) {
  const [file, setFile] = useState<File | null>(null)

  function handleUpload(file: File) {
    setFile(file)
  }

  return file ? (
    <ImagedEditPanel file={file} onClose={onClose} onSave={onUpload} />
  ) : (
    <ImageUploadPanel onClose={onClose} onUpload={handleUpload} />
  )
}
