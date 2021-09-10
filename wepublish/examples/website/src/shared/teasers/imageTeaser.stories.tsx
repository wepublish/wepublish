import React from 'react'
import {storiesOf} from '@storybook/react'
import {ImageTeaser} from './imageTeaser'
import {mockTeaserImage, mockAuthor, mockPeer} from '../.storybook/storiesMockData'
import {PageRoute} from '../route/routeContext'
import {GridBlock} from '../blocks/gridBlock'

storiesOf('Teaser|ImageTeaser*', module)
  .add('Default', () => (
    <ImageTeaser
      preTitle="Wahlen 2019"
      title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
      image={mockTeaserImage}
      author={mockAuthor}
      date={new Date()}
      peer={mockPeer}
      tags={['Article Tag']}
      route={PageRoute.create({})}
      isSingle={true}
    />
  ))
  .add('With Lead', () => (
    <ImageTeaser
      title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
      image={mockTeaserImage}
      author={mockAuthor}
      date={new Date()}
      lead={
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.'
      }
      peer={mockPeer}
      tags={['Article Tag']}
      route={PageRoute.create({})}
      isSingle={true}
    />
  ))
  .add('No Author', () => (
    <ImageTeaser
      title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
      image={mockTeaserImage}
      date={new Date()}
      lead={
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.'
      }
      peer={mockPeer}
      tags={['Article Tag']}
      route={PageRoute.create({})}
      isSingle={true}
    />
  ))
  .add('Grid', () => (
    <GridBlock numColumns={3}>
      <ImageTeaser
        preTitle="Wahlen 2019"
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={mockPeer}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <ImageTeaser
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        lead={
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.'
        }
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <ImageTeaser
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        date={new Date()}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
    </GridBlock>
  ))
