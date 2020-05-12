import React from 'react'
import {MaterialIconClose} from '@karma.run/icons'

import {NavigationButton, Panel, PanelHeader, PanelSection} from '@karma.run/ui'

import {Teaser} from '../blocks/types'

export interface TeaserEditPanelProps {
  teaser: Teaser

  onClose(): void
  onConfirm(teaser: Teaser): void
}

export function TeaserEditPanel({onClose}: TeaserEditPanelProps) {
  return (
    <Panel>
      <PanelHeader
        title="Edit Teaser"
        leftChildren={
          <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose()} />
        }
      />
      <PanelSection></PanelSection>
    </Panel>
  )
}
