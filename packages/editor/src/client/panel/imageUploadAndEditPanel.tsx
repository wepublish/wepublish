import React, {useState} from 'react'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageUploadPanel} from './imageUploadPanel'

export interface ImageUploadAndEditPanelProps {
  onClose(): void
  onUpload(ids: string[]): void
}

export function ImageUploadAndEditPanel({onClose, onUpload}: ImageUploadAndEditPanelProps) {
  const [id, setID] = useState<string | null>(null)

  function handleUpload(ids: string[]) {
    setID(ids[0])
    onUpload(ids)
  }

  return id ? (
    <ImagedEditPanel id={id} onClose={onClose} />
  ) : (
    <ImageUploadPanel onClose={onClose} onUpload={handleUpload} />
  )
}
