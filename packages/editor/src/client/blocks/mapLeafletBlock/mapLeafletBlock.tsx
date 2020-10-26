import React, {useState} from 'react'
import {Map, TileLayer, Marker, Popup} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './leaflet.css'
import {
  BlockProps,
  Box,
  ZIndex,
  IconButton,
  Spacing,
  Drawer,
  TypographicTextArea
} from '@karma.run/ui'
import {MaterialIconMoreVert} from '@karma.run/icons'
import {MapLeafletBlockValue} from '../types'
import {MapLeafletEditPanel} from '../../panel/mapLeafletEditPanel'
import {ElementID} from '../../../shared/elementID'
import {ClientSettings} from '../../../shared/types'
import Leaflet from 'leaflet'
import marker from './marker-icon.png'
import marker2x from './marker-icon-2x.png'
import markerShadow from './marker-shadow.png'
import {useTranslation} from 'react-i18next'

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
  const {t} = useTranslation()

  return (
    <>
      <Box position="relative" width="100%" height="100%">
        <Map
          dragging={false}
          zoomControl={false}
          boxZoom={false}
          doubleClickZoom={false}
          scrollWheelZoom={false}
          center={[centerLat, centerLng]}
          zoom={zoom}
          style={{width: '100%', height: '45vh'}}
          /* onViewportChange={viewport => {
            if (viewport.center && viewport.zoom) {
              onChange({
                ...value,
                centerLat: viewport.center[0],
                centerLng: viewport.center[1],
                zoom: viewport.zoom
              })
            }
          }} */
        >
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
            title={t('blocks.mapLeaflet.overview.addPOI')}
            variant="large"
            active
            onClick={() => setMapLeafletDialogOpen(true)}
            margin={Spacing.ExtraSmall}
          />
        </Box>

        <Box marginTop={Spacing.ExtraSmall}>
          <TypographicTextArea
            variant="subtitle2"
            align="center"
            placeholder={t('blocks.mapLeaflet.overview.caption')}
            value={caption}
            onChange={e => {
              onChange({...value, caption: e.target.value})
            }}
          />
        </Box>
      </Box>

      <Drawer open={isMapLeafletDialogOpen} width={480}>
        {() => (
          <MapLeafletEditPanel
            mapLeaflet={value}
            onClose={() => setMapLeafletDialogOpen(false)}
            onConfirm={mapleaflet => {
              onChange(mapleaflet)
              setMapLeafletDialogOpen(false)
            }}
          />
        )}
      </Drawer>
    </>
  )
}
