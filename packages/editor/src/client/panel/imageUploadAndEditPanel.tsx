import exifr from 'exifr'
import React, {useState} from 'react'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageUploadPanel} from './imageUploadPanel'
import {ImageMetaData, readImageMetaData} from '../atoms/imageMetaData'

export interface ImageUploadAndEditPanelProps {
  onClose(): void
  onUpload(): void
}

export function ImageUploadAndEditPanel({onClose, onUpload}: ImageUploadAndEditPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [imageMetaData, setImageMetaData] = useState<ImageMetaData>({
    title: '',
    description: '',
    source: '',
    link: '',
    licence: ''
  })
  async function handleUpload(file: File) {
    setImageMetaData(await readImageMetaData(file))
    setFile(file)
  }

  return file ? (
    <ImagedEditPanel
      file={file}
      onClose={onClose}
      onSave={onUpload}
      imageMetaData={imageMetaData}
    />
  ) : (
    <ImageUploadPanel onClose={onClose} onUpload={handleUpload} />
  )
}
