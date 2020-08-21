import React, {useState} from 'react'
import {MaterialIconClose} from '@karma.run/icons'

import {
  NavigationButton,
  Panel,
  PanelHeader,
  PanelSection,
  TextInput,
  Spacing,
  ListValue,
  ListInput,
  Box,
  FieldProps
} from '@karma.run/ui'

import {MapLeafletItem} from '../blocks/types'
import nanoid from 'nanoid'

export interface MapLeafletEditPanel {
  initialItems: ListValue<MapLeafletItem>[]

  onClose?(items: ListValue<MapLeafletItem>[]): void
}

export function MapLeafletEditPanel({onClose, initialItems}: MapLeafletEditPanel) {
  const [items, setItems] = useState<ListValue<MapLeafletItem>[]>(() =>
    initialItems.map(item => ({
      id: nanoid(),
      value: {
        lat: item.value.lat,
        lng: item.value.lng,
        title: item.value.title,
        description: item.value.description,
        image: null
      }
    }))
  )

  return (
    <Panel>
      <PanelHeader
        title="Edit map markers"
        leftChildren={
          <NavigationButton
            icon={MaterialIconClose}
            label="Close"
            onClick={() => onClose?.(items)}
          />
        }
      />
      <PanelSection>
        <ListInput
          value={items}
          onChange={items => setItems(items)}
          defaultValue={{lat: 0, lng: 0, title: '', description: '', image: null}}>
          {props => <MapLeafletItems {...props} />}
        </ListInput>
      </PanelSection>
    </Panel>
  )
}

export function MapLeafletItems({value, onChange}: FieldProps<MapLeafletItem>) {
  const {lat, lng, title, description, image} = value

  return (
    <>
      <Box display="flex" flexDirection="column">
        <TextInput
          marginBottom={Spacing.ExtraSmall}
          type="number"
          label="Latitude"
          value={lat}
          onChange={e => {
            const lat = Number(e.target.value)
            onChange(value => ({...value, lat}))
          }}
          required
        />
        <TextInput
          marginBottom={Spacing.ExtraSmall}
          type="number"
          label="Longitude"
          value={lng}
          onChange={e => {
            const lng = Number(e.target.value)
            onChange(value => ({...value, lng}))
          }}
          required
        />
        <TextInput
          marginBottom={Spacing.ExtraSmall}
          label="Title"
          value={title}
          onChange={e => {
            const title = e.target.value
            onChange(value => ({...value, title}))
          }}
        />
        <TextInput
          marginBottom={Spacing.ExtraSmall}
          label="Description"
          value={description}
          onChange={e => {
            const description = e.target.value
            onChange(value => ({...value, description}))
          }}
        />
      </Box>
    </>
  )
}
