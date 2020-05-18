import React, {useState} from 'react'
import {MaterialIconArrowBack} from '@karma.run/icons'

import {TeaserSelectPanel} from './teaserSelectPanel'
import {TeaserEditPanel} from './teaserEditPanel'
import {TeaserLink, Teaser} from '../blocks/types'
import {TeaserStyle} from '../api'

export interface TeaserSelectAndEditPanelProps {
  onClose: () => void
  onSelect: (teaser: Teaser) => void
}

export function TeaserSelectAndEditPanel({onClose, onSelect}: TeaserSelectAndEditPanelProps) {
  const [teaser, setTeaser] = useState<TeaserLink>()

  return teaser ? (
    <TeaserEditPanel
      closeLabel="Back"
      closeIcon={MaterialIconArrowBack}
      initialTeaser={{...teaser, style: TeaserStyle.Default, preTitle: '', title: '', lead: ''}}
      onClose={() => setTeaser(undefined)}
      onConfirm={teaser => onSelect(teaser)}
    />
  ) : (
    <TeaserSelectPanel onClose={onClose} onSelect={setTeaser} />
  )
}
