import React, {useState} from 'react'
import {Map, TileLayer, Marker, Popup} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '../customCSS/leaflet.css'

import {Icon} from 'leaflet'

// stupid hack so that leaflet's images work after going through webpack
//@ts-ignore
import marker from 'leaflet/dist/images/marker-icon.png'
//@ts-ignore
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
//@ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

//@ts-ignore
delete Icon.Default.prototype._getIconUrl

Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow
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
  Drawer,
  Image
} from '@karma.run/ui'

import {
  MaterialIconImageOutlined,
  MaterialIconEditOutlined,
  MaterialIconClose
} from '@karma.run/icons'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'

import {MapLeafletBlockValue, MapLeafletItem} from './types'

// import {isFunctionalUpdate} from '@karma.run/react'

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
        <Marker position={[centerLat, centerLng]}></Marker>
      </Map>
      <Box marginTop={Spacing.ExtraSmall}>
        <TypographicTextArea
          variant="subtitle2"
          align="center"
          placeholder="Caption"
          value={caption}
          onChange={e => {
            onChange({...value, caption: e.target.value})
          }}
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
