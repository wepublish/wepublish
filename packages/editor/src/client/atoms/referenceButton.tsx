import React from 'react'
import {Button} from 'rsuite'
import {Reference} from '../interfaces/referenceType'
import {ReferencePreview} from './referencePreview'
import {useTranslation} from 'react-i18next'

export function ReferenceButton({
  reference,
  onClick,
  onClose
}: {
  readonly reference?: Reference | null
  readonly onClose: (event: React.MouseEvent<HTMLElement>) => void
  readonly onClick: () => void
}) {
  const {t} = useTranslation()
  let ref = null
  if (reference) {
    ref = <ReferencePreview reference={reference} onClose={onClose} />
  } else {
    ref = (
      <Button appearance="ghost" active onClick={onClick}>
        {t('articleEditor.panels.chooseAReference')}
      </Button>
    )
  }
  return ref
}
