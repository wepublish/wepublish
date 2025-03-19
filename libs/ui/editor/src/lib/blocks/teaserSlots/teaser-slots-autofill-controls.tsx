'use client'

import {useState} from 'react'
import styled from '@emotion/styled'
import {Button, Panel, Tag, Toggle} from 'rsuite'
import GearIcon from '@rsuite/icons/Gear'
import {TeaserSlotsAutofillDialog} from './teaser-slots-autofill-dialog'
import {TeaserSlotsAutofillConfig, useTagListQuery} from '@wepublish/editor/api'

interface TeaserSlotsContorlsProps {
  config: TeaserSlotsAutofillConfig
  loadedTeasers: number
  autofillSlots: number
  onConfigChange: (config: TeaserSlotsAutofillConfig) => void
}

const ControlsContainer = styled(Panel)`
  margin-bottom: 16px;
  border-radius: 6px;
  background-color: #f9fafb;
  padding: 12px;
`

const ControlsSection = styled('div')`
  align-items: center;
  display: flex;
  gap: 15px;
`

const ControlsLabel = styled.span`
  margin-right: 8px;
`

const SummarySection = styled.div``

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`

export function TeaserSlotsAutofillControls({
  config,
  autofillSlots,
  loadedTeasers,
  onConfigChange
}: TeaserSlotsContorlsProps) {
  const [configDialogOpen, setConfigDialogOpen] = useState(false)

  const {data: tagsData, refetch} = useTagListQuery({
    variables: {
      filter: {
        ids: config.tags ?? []
      }
    }
  })

  const handleToggleChange = (checked: boolean) => {
    if (!checked) {
      onConfigChange({enabled: false})
    } else {
      setConfigDialogOpen(true)
    }
  }

  const handleConfigSave = (newConfig: TeaserSlotsAutofillConfig) => {
    onConfigChange({
      ...newConfig,
      enabled: true
    })
    setConfigDialogOpen(false)
    refetch({filter: {ids: newConfig.tags}})
  }

  const handleConfigCancel = () => {
    setConfigDialogOpen(false)
  }

  return (
    <ControlsContainer bordered>
      <ControlsSection>
        <div>
          <ControlsLabel>Auto-loading:</ControlsLabel>
          <Toggle checked={config.enabled} onChange={handleToggleChange} size="md" />
          <ControlsLabel style={{marginLeft: '8px'}}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </ControlsLabel>

          {config.enabled && (
            <Button
              appearance="ghost"
              size="sm"
              onClick={() => setConfigDialogOpen(true)}
              style={{marginLeft: '8px'}}>
              <GearIcon style={{marginRight: '4px'}} />
              Configure
            </Button>
          )}
        </div>
        <SummarySection>
          {config.enabled ? (
            <>
              {tagsData?.tags && tagsData.tags.nodes.length > 0 ? (
                <TagsContainer>
                  {tagsData.tags.nodes.map((tag, index) => (
                    <Tag key={index} color="blue">
                      {tag.tag}
                    </Tag>
                  ))}
                </TagsContainer>
              ) : (
                <Tag color="green">Latest</Tag>
              )}
              <span style={{marginLeft: '8px'}}>
                {loadedTeasers}
                {loadedTeasers < autofillSlots ? `/${autofillSlots}` : ``} teasers loaded{' '}
              </span>
            </>
          ) : (
            <span style={{color: '#6b7280'}}>All slots will be manually filled</span>
          )}
        </SummarySection>
      </ControlsSection>

      <TeaserSlotsAutofillDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        config={config}
        onSave={handleConfigSave}
        onCancel={handleConfigCancel}
      />
    </ControlsContainer>
  )
}
