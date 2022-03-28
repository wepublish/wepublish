import React, {useState} from 'react'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageUploadPanel} from './imageUploadPanel'
import exifr from 'exifr'

export interface ImageUploadAndEditPanelProps {
  onClose(): void
  onUpload(): void
}

export type ImageMetaData = {
  [key: string]: string
}

type metaTagsMap = {
  [key: string]: string[]
}

const DEFAULT_META_TAG_MAP: metaTagsMap = {
  title: ['Headline', 'title.value'],
  description: ['ImageDescription', 'description.value', 'Caption'],
  author: ['Artist', 'creator', 'Credit'],
  source: ['WebStatement'],
  licence: ['Copyright', 'CopyrightNotice', 'rights.value']
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
    setImageMetaData(await readImageMetaData(file))
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

  async function readImageMetaData(data: File): Promise<ImageMetaData> {
    const tags = await exifr.parse(data, true)
    const fields: ImageMetaData = {
      title: '',
      description: '',
      author: '',
      source: '',
      licence: ''
    }
    for (const field in DEFAULT_META_TAG_MAP) {
      for (const tag of DEFAULT_META_TAG_MAP[field]) {
        const foundTag = findNestedMetaFields(tags, tag)
        if (foundTag) {
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
