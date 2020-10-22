import React, {useEffect, useState} from 'react'
import {MaterialIconClose} from '@karma.run/icons'
import {MarkerPoint, queryOpenCage} from '../utility'

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
  MarginProps,
  PanelSectionHeader
} from '@karma.run/ui'

import {MapLeafletItem} from '../blocks/types'
import nanoid from 'nanoid'
import {useTranslation} from 'react-i18next'

export interface MapLeafletEditPanel {
  initialItems: ListValue<MapLeafletItem>[]
  onClose?(items: ListValue<MapLeafletItem>[]): void
}

export function MapLeafletEditPanel({onClose, initialItems}: MapLeafletEditPanel) {
  const {t} = useTranslation()

  const defaultItemValue = {
    address: 'Brauerstrasse 42, Zürich',
    lat: 47.3778762,
    lng: 8.5271078,
    title: '',
    description: '',
    image: null
  }
  const [items, setItems] = useState<ListValue<MapLeafletItem>[]>(() =>
    initialItems.map(item =>
      item.value.address === ''
        ? {
            id: nanoid(),
            value: defaultItemValue
          }
        : {
            id: nanoid(),
            value: {
              address: item.value.address,
              lat: item.value.lat,
              lng: item.value.lng,
              title: item.value.title,
              description: item.value.description,
              image: null
            }
          }
    )
  )

  return (
    <Panel>
      <PanelHeader
        title={t('blocks.mapLeaflet.panels.editMapMarkers')}
        leftChildren={
          <NavigationButton
            icon={MaterialIconClose}
            label={t('blocks.mapLeaflet.panels.close')}
            onClick={() => onClose?.(items)}
          />
        }
      />
      <PanelSection>
        <PanelSectionHeader title="Map Center" />
        <PanelSectionHeader title="Map Markers" />
        <ListInput
          value={items}
          onChange={items => setItems(items)}
          defaultValue={defaultItemValue}>
          {props => <MapLeafletItems {...props} />}
        </ListInput>
      </PanelSection>
    </Panel>
  )
}

export function MapLeafletItems({value, onChange}: FieldProps<MapLeafletItem>) {
  const {t} = useTranslation()
  const {address, lat, lng, title, description} = value

  return (
    <>
      <Box display="flex" flexDirection="column">
        <AddressInput
          label={t('blocks.mapLeaflet.panels.address')}
          value={[{address: address, lat: lat, lng: lng}]}
          marginBottom={Spacing.ExtraSmall}
          onChange={markerPoints => {
            if (markerPoints !== undefined && markerPoints.length > 0) {
              onChange({
                ...value,
                address: markerPoints[1].address,
                lat: markerPoints[1].lat,
                lng: markerPoints[1].lng
              })
            }
          }}
        />
        <TextInput
          marginBottom={Spacing.ExtraSmall}
          type="number"
          label={t('blocks.mapLeaflet.panels.latitude')}
          value={lat}
          onChange={e => onChange({...value, lat: parseInt(e.target.value)})}
          required
        />
        <TextInput
          marginBottom={Spacing.ExtraSmall}
          type="number"
          label={t('blocks.mapLeaflet.panels.longitude')}
          value={lng}
          onChange={e => onChange({...value, lng: parseInt(e.target.value)})}
          required
        />
        <TextInput
          marginBottom={Spacing.ExtraSmall}
          label={t('blocks.mapLeaflet.panels.title')}
          value={title}
          onChange={e => onChange({...value, title: e.target.value})}
        />
        <TextInput
          marginBottom={Spacing.ExtraSmall}
          label={t('blocks.mapLeaflet.panels.description')}
          value={description}
          onChange={e => onChange({...value, description: e.target.value})}
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
      label={props.label}
      valueToChipData={markerPoint => ({
        id: nanoid(),
        label: markerPoint.address
      })}>
      {propsAutocompleteInput => <AddressInputList {...propsAutocompleteInput} />}
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
  const {t} = useTranslation()
  const [items, setItems] = useState<MarkerPoint[]>([])

  useEffect(() => {
    async function getItems() {
      if (inputValue !== null && inputValue.length > 1) {
        const response = await queryOpenCage(inputValue)
        setItems(response)
      }
    }
    getItems()
  }, [inputValue])

  return (
    <SelectList {...getMenuProps()}>
      {isOpen && inputValue ? (
        items.length ? (
          items.map((item: MarkerPoint, index: number) => {
            return (
              <SelectListItem
                key={index}
                highlighted={index === highlightedIndex}
                {...getItemProps({item, index})}>
                <Box display="flex">{item.address}</Box>
              </SelectListItem>
            )
          })
        ) : (
          <SelectListItem>{t('blocks.mapLeaflet.panels.noAddressFound')}</SelectListItem>
        )
      ) : null}
    </SelectList>
  )
}
