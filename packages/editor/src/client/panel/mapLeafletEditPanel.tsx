import React, {useEffect, useState} from 'react'
import {MaterialIconClose} from '@karma.run/icons'
import {MarkerPoint} from '../utility'
import axios from 'axios'

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
  FieldProps,
  AutocompleteInput,
  AutocompleteInputListProps,
  SelectList,
  SelectListItem,
  MarginProps
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
        address: item.value.address,
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
          defaultValue={{address: '', lat: 0, lng: 0, title: '', description: '', image: null}}>
          {props => <MapLeafletItems {...props} />}
        </ListInput>
      </PanelSection>
    </Panel>
  )
}

export function MapLeafletItems({value, onChange}: FieldProps<MapLeafletItem>) {
  const {lat, lng, title, description} = value

  return (
    <>
      <Box display="flex" flexDirection="column">
        <AddressInput
          label="Address"
          value={[{address: value.address, lat: value.lat, lng: value.lng}]}
          marginBottom={Spacing.ExtraSmall}
          onChange={markerPoints => {
            markerPoints !== undefined && markerPoints.length > 0
              ? onChange({
                  ...value,
                  address: markerPoints[0].address,
                  lat: markerPoints[0].lat,
                  lng: markerPoints[0].lng
                })
              : []
          }}
        />
        <TextInput
          marginBottom={Spacing.ExtraSmall}
          type="number"
          label="Latitude"
          value={lat}
          onChange={e => onChange({...value, lat: parseInt(e.target.value)})}
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

export interface AddressInputProps extends MarginProps {
  label?: string
  description?: string
  value: MarkerPoint[]
  onChange(address?: MarkerPoint[]): void
}

export function AddressInput(props: AddressInputProps) {
  return (
    <AutocompleteInput
      {...props}
      valueToChipData={markerPoint => ({
        id: nanoid(),
        label: markerPoint.address
      })}>
      {propsACI => <AddressInputList {...propsACI} />}
    </AutocompleteInput>
  )
}

function AddressInputList({
  isOpen,
  inputValue,
  highlightedIndex,
  getItemProps,
  getMenuProps
}: AutocompleteInputListProps) {
  const [items, setItems] = useState<MarkerPoint[]>([])
  const api = 'ab48a007c6dd4906adcd2871a5deaebe'
  const fetchURL = `https://api.opencagedata.com/geocode/v1/json?key=${api}&q=${inputValue}&limit=5&pretty=1`

  useEffect(() => {
    async function fetchData() {
      if (inputValue !== null && inputValue.length > 1) {
        try {
          const request = await axios.get(fetchURL)
          const items = request.data.results.map((res: any) => {
            return {
              lat: res.geometry.lat,
              lng: res.geometry.lng,
              address: res.formatted
            }
          })
          setItems(items)
          console.log(items)
        } catch (error) {
          console.error(error)
        }
      }
    }
    fetchData()
  }, [inputValue])

  return (
    <SelectList {...getMenuProps()}>
      {isOpen && inputValue ? (
        items.length ? (
          items.map((item: MarkerPoint, index: number) => (
            <SelectListItem
              key={nanoid()}
              highlighted={index === highlightedIndex}
              {...getItemProps({item, index})}>
              <Box display="flex">{item.address}</Box>
            </SelectListItem>
          ))
        ) : (
          <SelectListItem>No Address found</SelectListItem>
        )
      ) : null}
    </SelectList>
  )
}
