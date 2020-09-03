import React, {useState} from 'react'
import {Map, TileLayer, Marker, Popup} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '../customCSS/leaflet.css'
import {BlockProps, Box, ZIndex, IconButton, Spacing, TextInput, Drawer} from '@karma.run/ui'
import {MaterialIconMoreVert} from '@karma.run/icons'
import {MapLeafletBlockValue} from './types'
import {MapLeafletEditPanel} from '../panel/mapLeafletEditPanel'
import {Icon} from 'leaflet'

// workaround to ensure that leaflet's images work after going through webpack
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

export interface MapLeafletBlockProps extends BlockProps<MapLeafletBlockValue> {}

export function MapLeafletBlock({value, onChange}: BlockProps<MapLeafletBlockValue>) {
  const {zoom, centerLat, centerLng, caption, items} = value
  const [isMapLeafletDialogOpen, setMapLeafletDialogOpen] = useState(false)

  return (
    <>
      <Box position="relative" width="100%" height="100%">
        <Map
          center={[centerLat, centerLng]}
          zoom={zoom}
          style={{width: '100%', height: '45vh'}}
          onViewportChange={viewport => {
            if (viewport.center && viewport.zoom) {
              onChange({
                ...value,
                centerLat: viewport.center[0],
                centerLng: viewport.center[1],
                zoom: viewport.zoom
              })
            }
          }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          {items.map((item, index) => (
            <Marker position={[item.value.lat, item.value.lng]} key={index}>
              <Popup>
                <b>{item.value.title}</b> <br />
                {item.value.description}
              </Popup>
            </Marker>
          ))}
        </Map>
        <Box position="absolute" zIndex={ZIndex.Default} top={0} right={0}>
          <IconButton
            icon={MaterialIconMoreVert}
            title={'Add point of interest'}
            variant="large"
            active
            onClick={() => setMapLeafletDialogOpen(true)}
            margin={Spacing.ExtraSmall}
          />
        </Box>
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
      </Box>

      <Drawer open={isMapLeafletDialogOpen} width={480}>
        {() => (
          <MapLeafletEditPanel
            initialItems={value.items}
            onClose={items => {
              onChange({...value, items})
              setMapLeafletDialogOpen(false)
            }}
          />
        )}
      </Drawer>
    </>
  )
}
