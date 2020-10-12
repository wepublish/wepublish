import React, {useState} from 'react'
import {Map, TileLayer, Marker, Popup} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './leaflet.css'
import {BlockProps, Box, ZIndex, IconButton, Spacing, TextInput, Drawer} from '@karma.run/ui'
import {MaterialIconMoreVert} from '@karma.run/icons'
import {MapLeafletBlockValue} from '../types'
import {MapLeafletEditPanel} from '../../panel/mapLeafletEditPanel'
import {ElementID} from '../../../shared/elementID'
import {ClientSettings} from '../../../shared/types'
import Leaflet from 'leaflet'
import marker from './marker-icon.png'
import marker2x from './marker-icon-2x.png'
import markerShadow from './marker-shadow.png'

export type MapLeafletBlockProps = BlockProps<MapLeafletBlockValue>

export function MapLeafletBlock({value, onChange}: BlockProps<MapLeafletBlockValue>) {
  const {zoom, centerLat, centerLng, caption, items} = value
  const [isMapLeafletDialogOpen, setMapLeafletDialogOpen] = useState(false)
  const {tilelayerURL, tilelayerAttribution}: ClientSettings = JSON.parse(
    document.getElementById(ElementID.Settings)!.textContent!
  )
  const markerIcon = Leaflet.icon({
    iconRetinaUrl: marker2x,
    iconUrl: marker,
    shadowUrl: markerShadow,
    shadowAnchor: [-7, 0]
  })

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
          <TileLayer url={tilelayerURL} attribution={tilelayerAttribution} />
          {items.map((item, index) => (
            <Marker position={[item.value.lat, item.value.lng]} key={index} icon={markerIcon}>
              <Popup>
                <p>
                  <b>{item.value.title}</b>
                </p>
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
