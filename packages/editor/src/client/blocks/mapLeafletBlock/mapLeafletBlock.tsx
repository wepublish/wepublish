import React, {useState} from 'react'
import {Map, TileLayer, Marker} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './leaflet.css'

import L from 'leaflet'

import marker from './marker-icon.png'
import marker2x from './marker-icon-2x.png'
import markerShadow from './marker-shadow.png'

let MarkerIcon = L.icon({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
  shadowAnchor: [-7, 0]
})

import {
  BlockProps,
  FieldProps,
  Box,
  Card,
  PlaceholderInput,
  ZIndex,
  IconButton,
  Spacing,
  TypographicTextArea,
  TextInput,
  Drawer,
  Image
} from '@karma.run/ui'

import {
  MaterialIconImageOutlined,
  MaterialIconEditOutlined,
  MaterialIconClose
} from '@karma.run/icons'

import {ImageSelectPanel} from '../../panel/imageSelectPanel'
import {ImagedEditPanel} from '../../panel/imageEditPanel'
import {MapLeafletBlockValue, MapLeafletItem} from '../types'

export interface MapLeafletBlockProps extends BlockProps<MapLeafletBlockValue> {}

export function MapLeafletBlock({value, onChange, disabled}: BlockProps<MapLeafletBlockValue>) {
  const {zoom, centerLat, centerLng, caption} = value

  return (
    <>
      <Map
        center={[centerLat, centerLng]}
        zoom={zoom}
        style={{width: '100%', height: '45vh'}}
        onViewportChange={e => {
          if (e.center && e.zoom) {
            onChange({...value, centerLat: e.center[0], centerLng: e.center[1], zoom: e.zoom})
          }
        }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[centerLat, centerLng]} icon={MarkerIcon}></Marker>
      </Map>
      <Box marginTop={Spacing.ExtraSmall}>
        <TextInput
          label="Caption"
          description="Map description"
          value={caption}
          onChange={event => {
            onChange({...value, caption: event.target.value})
          }}
          marginBottom={Spacing.Small}
        />
      </Box>
    </>
  )
}
// This function will be used for Map-items
export function MapLeafletItemElement({value, onChange}: FieldProps<MapLeafletItem>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  //@ts-ignore
  const {image, title, lat, lng, description} = value

  return (
    <>
      <Box display="flex" flexDirection="row">
        <Card
          overflow="hidden"
          width={200}
          height={150}
          marginRight={Spacing.ExtraSmall}
          flexShrink={0}>
          <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
            {image && (
              <Box position="relative" width="100%" height="100%">
                <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
                  <IconButton
                    icon={MaterialIconImageOutlined}
                    title="Choose Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => setChooseModalOpen(true)}
                  />
                  <IconButton
                    icon={MaterialIconEditOutlined}
                    title="Edit Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => setEditModalOpen(true)}
                  />
                  <IconButton
                    icon={MaterialIconClose}
                    title="Remove Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => onChange(value => ({...value, image: null}))}
                  />
                </Box>
                {image.previewURL && <Image src={image.previewURL} width="100%" height="100%" />}
              </Box>
            )}
          </PlaceholderInput>
        </Card>
        <Box flexGrow={1}>
          <TypographicTextArea
            variant="h1"
            placeholder="Title"
            value={title}
            onChange={e => {
              const title = e.target.value
              onChange(value => ({...value, title}))
            }}
          />
        </Box>
      </Box>

      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={image => {
              setChooseModalOpen(false)
              onChange(value => ({...value, image}))
            }}
          />
        )}
      </Drawer>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <ImagedEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        )}
      </Drawer>
    </>
  )
}
