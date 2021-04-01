import React from 'react'
import {Tag, TagGroup} from 'rsuite'
import {useContentGetQuery} from '../api'
import {Reference} from '../interfaces/referenceType'
import {ContentEditRoute, Link} from '../route'

export function ReferencePreview({
  reference,
  onClose
}: {
  readonly reference?: Reference
  readonly onClose: (event: React.MouseEvent<HTMLElement>) => void
}) {
  if (!reference) return null

  const {data} = useContentGetQuery({
    variables: {
      id: reference.recordId
    }
  })

  let revSummary = `Type: ${reference.contentType} Id: ${reference.recordId}`
  if (data?.content._all.read.title) {
    const {title} = data.content._all.read
    revSummary = title
  }
  return (
    <TagGroup>
      <Tag closable onClose={onClose}>
        <Link
          route={ContentEditRoute.create({type: reference.contentType, id: reference.recordId})}>
          {revSummary}
        </Link>
      </Tag>
    </TagGroup>
  )
}
