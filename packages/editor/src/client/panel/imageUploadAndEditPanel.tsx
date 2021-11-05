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
  const [resizedFile, setResizedFile] = useState<boolean>(false)

  async function handleUpload(originalFile: File) {
    const {file, resized} = await resizeImage(originalFile)
    setResizedFile(resized)
    setFile(file)
  }

  /**
   * Resizes an image on client side, if larger than 10 MB, which is the upload max of the api
   * @param file
   */
  async function resizeImage(file: File): Promise<{file: File; resized: boolean}> {
    const originalFileSize: number = file.size / (1000 * 1000)
    // only resize image if larger than 10 MB
    if (originalFileSize < 10) {
      return {
        file,
        resized: false
      }
    }
    const originalFileName: string = file.name
    if (!originalFileName) {
      throw new Error('No file name provided!')
    }
    const resizedImage = await new Compress().compress([file], {
      size: 10, // the max size in MB, defaults to 2MB
      quality: 1, // the quality of the image, max is 1,
      resize: false // defaults to true, set false if you do not want to resize the image width and height
    })
    const img = resizedImage[0]
    const base64str = img.data
    const imgExt = img.ext
    const blob: Blob = Compress.convertBase64ToFile(base64str, imgExt)
    // convert blob to file
    return {
      file: new File([blob], originalFileName, {type: blob.type}),
      resized: true
    }
  }

  return file ? (
    <ImagedEditPanel file={file} resizedFile={resizedFile} onClose={onClose} onSave={onUpload} />
  ) : (
    <ImageUploadPanel onClose={onClose} onUpload={handleUpload} />
  )
}
