import React, {useState} from 'react'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageUploadPanel} from './imageUploadPanel'
import Compress from 'compress.js'

export interface ImageUploadAndEditPanelProps {
  onClose(): void
  onUpload(): void
}

export function ImageUploadAndEditPanel({onClose, onUpload}: ImageUploadAndEditPanelProps) {
  const [file, setFile] = useState<File | null>(null)

  async function handleUpload(file: File) {
    // todo: if file size is > 10 mb => resize
    const resizedImage: File = await resizeImage(file)
    setFile(resizedImage)
  }

  /**
   * todo: describe function
   * @param file
   */
  async function resizeImage(file: File): Promise<File> {
    const resizedImage = await new Compress().compress([file], {
      size: 10, // the max size in MB, defaults to 2MB
      quality: 1, // the quality of the image, max is 1,
      resize: true // defaults to true, set false if you do not want to resize the image width and height
    })
    const img = resizedImage[0]
    const base64str = img.data
    const imgExt = img.ext
    const blob: Blob = Compress.convertBase64ToFile(base64str, imgExt)
    return new File([blob], file.name, {type: blob.type})
  }

  return file ? (
    <ImagedEditPanel file={file} onClose={onClose} onSave={onUpload} />
  ) : (
    <ImageUploadPanel onClose={onClose} onUpload={handleUpload} />
  )
}
