import React from 'react'
import {storiesOf} from '@storybook/react'
import {TextTeaser} from './textTeaser'
import {mockAuthor, mockPeer} from '../.storybook/storiesMockData'
import {PageRoute} from '../route/routeContext'
import {GridBlock} from '../blocks/gridBlock'

storiesOf('Teaser|TextTeaser*', module)
  .add('Default', () => (
    <TextTeaser
      title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
      lead="Am 20. Oktober wählt die Schweiz ein neues Parlament. Wie präsentiert sich die Ausgangslage in den Kantonen?"
      author={mockAuthor}
      date={new Date()}
      peer={mockPeer}
      tags={['Article Tag']}
      route={PageRoute.create({})}
    />
  ))
  .add('Grid', () => (
    <GridBlock numColumns={3}>
      <TextTeaser
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        lead="Am 20. Oktober wählt die Schweiz ein neues Parlament. Wie präsentiert sich die Ausgangslage in den Kantonen?"
        author={mockAuthor}
        date={new Date()}
        peer={mockPeer}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <TextTeaser
        preTitle={'Wahlen 2019'}
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        lead="Am 20. Oktober wählt die Schweiz ein neues Parlament. Wie präsentiert sich die Ausgangslage in den Kantonen?"
        author={mockAuthor}
        date={new Date()}
        peer={mockPeer}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <TextTeaser
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        lead="Am 20. Oktober wählt die Schweiz ein neues Parlament. Wie präsentiert sich die Ausgangslage in den Kantonen?"
        date={new Date()}
        peer={mockPeer}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
    </GridBlock>
  ))
