import React, {useState} from 'react'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageUploadPanel} from './imageUploadPanel'
import exifr from 'exifr'

export interface ImageUploadAndEditPanelProps {
  onClose(): void
  onUpload(): void
}

export type ImageMetaData = {
  title: string
  description: string
  author: string
  source: string
  licence: string
}

const DEFAULT_META_TAG_MAP = {
  title: [],
  description: ['ImageDescription', 'description.value'],
  author: ['creator', 'Credit'],
  source: ['WebStatement'],
  licence: ['Copyright', 'CopyrightNotice']
}

export function ImageUploadAndEditPanel({onClose, onUpload}: ImageUploadAndEditPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [imageMetaData, setImageMetaData] = useState<ImageMetaData>({
    title: '',
    description: '',
    author: '',
    source: '',
    licence: ''
  })
  async function handleUpload(file: File) {
    setImageMetaData(await readPictureMetaData(file))
    setFile(file)
  }

  function findNestedMetaFields(tags: any, tag: string) {
    const nestedTags = tag.split('.')
    let base = tags
    for (const nestedTag of nestedTags) {
      if (base[nestedTag]) {
        base = base[nestedTag]
      } else {
        return false
      }
    }
    return base
  }

  async function readPictureMetaData(data: File) {
    const tags = await exifr.parse(data, true)

    const fields = {
      title: '',
      description: '',
      author: '',
      source: '',
      licence: ''
    }
    for (const field in DEFAULT_META_TAG_MAP) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      for (const tag of DEFAULT_META_TAG_MAP[field]) {
        const foundTag = findNestedMetaFields(tags, tag)
        if (foundTag) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          fields[field] = foundTag
          break
        }
      }
    }
    return {
      title: fields.title,
      description: fields.description,
      author: fields.author,
      source: fields.source,
      licence: fields.licence
    }
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
