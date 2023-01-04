import PencilIcon from '@rsuite/icons/legacy/Pencil'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Drawer, IconButton, Panel} from 'rsuite'

import {EventRefFragment} from '../api'
import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {SelectEventPanel} from '../panel/selectEventsPanel'
import {EventEndsAtView, EventStartsAtView} from '../routes/events/eventListView'
import {EventBlockValue} from './types'

const EventPreview = ({event}: {event: EventRefFragment}) => (
  <Panel
    key={event.id}
    bordered
    style={{
      background: '#fff',
      display: 'grid',
      alignItems: 'center'
    }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '12px',
        alignItems: 'center'
      }}>
      <img
        src={event.image?.previewURL ?? '/static/placeholder-240x240.png'}
        alt={event.image?.description ?? ''}
        height={event.image?.height}
        width={event.image?.width}
        style={{
          width: '100%',
          height: 'auto'
        }}
      />

      <div style={{display: 'grid'}}>
        {event.name}

        <small>
          <EventStartsAtView startsAt={event.startsAt} />
        </small>

        <small>
          <EventEndsAtView endsAt={event.endsAt} />
        </small>
      </div>
    </div>
  </Panel>
)

export const EventBlock = ({
  value: {filter, events},
  onChange,
  autofocus
}: BlockProps<EventBlockValue>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const {t} = useTranslation()

  const isEmpty = !events.length
  const eventsToDisplay = events.slice(0, 4)

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
          minHeight: 200,
          overflow: 'hidden',
          backgroundColor: '#f7f9fa'
        }}>
        <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
          {!isEmpty && (
            <div
              style={{
                position: 'relative',
                width: '100%'
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

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '24px'
                }}>
                {eventsToDisplay.map(event => (
                  <EventPreview key={event.id} event={event} />
                ))}
              </div>

              <p style={{marginBottom: '12px', textAlign: 'center'}}>
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
