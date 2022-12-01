import PencilIcon from '@rsuite/icons/legacy/Pencil'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Drawer, IconButton, Panel} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {SelectEventPanel} from '../panel/selectEventsPanel'
import {EventBlockValue} from './types'

export const EventBlock = ({
  value: {filter, events},
  onChange,
  autofocus
}: BlockProps<EventBlockValue>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const {t} = useTranslation()

  const isEmpty = !events.length

  useEffect(() => {
    if (autofocus && isEmpty) {
      setIsDialogOpen(true)
    }
  }, [])

  return (
    <>
      <Panel
        bodyFill
        bordered
        style={{
          height: 200,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#f7f9fa'
        }}>
        <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
          {!isEmpty && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <div
                style={{
                  position: 'absolute',
                  zIndex: 100,
                  height: '100%',
                  right: 0
                }}>
                <IconButton size={'lg'} icon={<PencilIcon />} onClick={() => setIsDialogOpen(true)}>
                  {t('blocks.event.edit')}
                </IconButton>
              </div>

              <p>
                {t('blocks.event.events', {
                  count: events.length ? events.length : filter.events?.length ?? 0
                })}
              </p>
            </div>
          )}
        </PlaceholderInput>
      </Panel>

      <Drawer size="lg" open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <SelectEventPanel
          selectedFilter={filter}
          onClose={() => setIsDialogOpen(false)}
          onSelect={(newFilter, newEvents) => {
            setIsDialogOpen(false)
            onChange({filter: newFilter, events: newEvents})
          }}
        />
      </Drawer>
    </>
  )
}
