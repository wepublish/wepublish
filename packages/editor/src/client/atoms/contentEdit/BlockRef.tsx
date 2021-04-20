import React, {memo, useState} from 'react'
import {Modal} from 'rsuite'
import {ContentContextEnum} from '../../api'
import {ContentModelSchemaFieldRef} from '../../interfaces/contentModelSchema'
import {Reference} from '../../interfaces/referenceType'
import {SchemaPath} from '../../interfaces/utilTypes'
import {RefSelectModal} from '../../panel/refSelectPanelModal'
import {ContentEditAction, ContentEditActionEnum} from '../../routes/contentEditor'
import {ReferenceButton} from '../referenceButton'

interface BlockRefProps {
  readonly schemaPath: SchemaPath
  readonly dispatch: React.Dispatch<ContentEditAction>
  readonly value?: Reference | null
  readonly model: ContentModelSchemaFieldRef
}

function BlockRef({value, schemaPath, dispatch}: BlockRefProps) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)

  return (
    <>
      <ReferenceButton
        reference={value}
        onClick={() => setChooseModalOpen(true)}
        onClose={() => {
          dispatch({
            type: ContentEditActionEnum.update,
            schemaPath,
            value: null
          })
        }}></ReferenceButton>
      <Modal show={isChooseModalOpen} size="lg" onHide={() => setChooseModalOpen(false)}>
        <RefSelectModal
          config={{
            modelA: {scope: ContentContextEnum.Local}
          }}
          onClose={() => setChooseModalOpen(false)}
          onSelectRef={ref => {
            setChooseModalOpen(false)
            dispatch({
              type: ContentEditActionEnum.update,
              value: ref,
              schemaPath
            })
          }}
        />
      </Modal>
    </>
  )
}

export default memo(BlockRef, (a, b) => {
  return Object.is(a.value, b.value)
})
