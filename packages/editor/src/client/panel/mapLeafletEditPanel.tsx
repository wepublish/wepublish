import React, {useEffect, useState} from 'react'
import {MaterialIconClose} from '@karma.run/icons'
import {geoCodeWithOpenCage, MarkerPoint} from '../utility'

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
  const {address, lat, lng, title, description} = value

  const [addressQuery, setAddressQuery] = useState(address)
  const [data, setData] = useState<any>([])

  useEffect(() => {
    async function asyncGeoCode() {
      if (addressQuery != '' && addressQuery.length > 1) {
        const data = await geoCodeWithOpenCage(addressQuery, 5)
        setData(data)
      }
    }
    asyncGeoCode()
  }, [addressQuery])

  return (
    <>
      <ul>
        {data.map((item: any) => {
          return <li>{item.address}</li>
        })}
      </ul>
      <Box display="flex" flexDirection="column">
        <TextInput
          value={addressQuery}
          marginBottom={Spacing.ExtraSmall}
          type="address"
          label="Address"
          onChange={e => {
            //onChange(value => ({...value, lat}))
            setAddressQuery(e.target.value)
            //geoCodeWithOpenCage(address, 5)
          }}
          required
        />
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
/*
export function AddressInput(props: AddressInputList) {
  return (
    <AutocompleteInput
      {...props}
      valueToChipData={author => ({
        id: author.id,
        label: author.name,
        imageURL: author.image?.squareURL ?? undefined
      })}>
      {props => <AddressInputList {...props} />}
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
  const [items, setItems] = useState<AuthorRefFragment[]>([])
  const {data, loading: isLoading} = useAuthorListQuery({
    variables: {filter: inputValue || undefined, first: 10},
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    setItems(data?.authors.nodes ?? [])
  }, [data])

  return (
    <SelectList {...getMenuProps()}>
      {isOpen && inputValue ? (
        !isLoading ? (
          items.length ? (
            items.map((item, index) => (
              <SelectListItem
                key={item.id}
                highlighted={index === highlightedIndex}
                {...getItemProps({item, index})}>
                <Box display="flex">{item.name}</Box>
              </SelectListItem>
            ))
          ) : (
            <SelectListItem>No Address found</SelectListItem>
          )
        ) : (
          <SelectListItem>Loading...</SelectListItem>
        )
      ) : null}
    </SelectList>
  )
}
*/
