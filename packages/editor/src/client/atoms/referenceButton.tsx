import React from 'react'
import {Button} from 'rsuite'
import {Reference} from '../interfaces/referenceType'
import {ReferencePreview} from './referencePreview'

export function ReferenceButton({
  reference,
  onClick,
  onClose
}: {
  readonly reference?: Reference | null
  readonly onClose: (event: React.MouseEvent<HTMLElement>) => void
  readonly onClick: () => void
}) {
  let ref = null
  if (reference) {
    ref = <ReferencePreview reference={reference} onClose={onClose} />
  } else {
    ref = (
      <Button appearance="ghost" active onClick={onClick}>
        Reference to
      </Button>
    )
  }
  return ref
}
