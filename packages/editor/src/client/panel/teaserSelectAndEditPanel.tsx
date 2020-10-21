import React, {useState} from 'react'
import {MaterialIconArrowBack} from '@karma.run/icons'

import {TeaserSelectPanel} from './teaserSelectPanel'
import {TeaserEditPanel} from './teaserEditPanel'
import {TeaserLink, Teaser} from '../blocks/types'
import {TeaserStyle} from '../api'
import {Drawer} from '@karma.run/ui'

import {useTranslation} from 'react-i18next'

export interface TeaserSelectAndEditPanelProps {
  onClose: () => void
  onSelect: (teaser: Teaser) => void
}

export function TeaserSelectAndEditPanel({onClose, onSelect}: TeaserSelectAndEditPanelProps) {
  const [teaser, setTeaser] = useState<TeaserLink>()
  const [isEditOpen, setEditOpen] = useState(false)

  const {t} = useTranslation()

  return (
    <>
      <TeaserSelectPanel
        onClose={onClose}
        onSelect={teaser => {
          setEditOpen(true)
          setTeaser(teaser)
        }}
      />
      <Drawer open={isEditOpen} width={480}>
        {() => (
          <TeaserEditPanel
            closeLabel={t('articleEditor.panels.back')}
            closeIcon={MaterialIconArrowBack}
            initialTeaser={{
              ...teaser!,
              style: TeaserStyle.Default,
              preTitle: '',
              title: '',
              lead: ''
            }}
            onClose={() => setEditOpen(false)}
            onConfirm={teaser => {
              setEditOpen(false)
              onSelect(teaser)
            }}
          />
        )}
      </Drawer>
    </>
  )
}
