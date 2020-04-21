import React from 'react'
import {storiesOf} from '@storybook/react'
import {DefaultTeaser} from './defaultTeaser'
import {
  mockTeaserImage,
  mockAuthor,
  mockTeaserRoute,
  mockImage,
  mockPeer
} from '../.storybook/storiesMockData'
import {GridBlock} from '../blocks/gridBlock'

let oldDate = new Date()
oldDate.setFullYear(2018)

storiesOf('Teaser|DefaultTeaser*', module)
  .add('Image', () => (
    <DefaultTeaser
      title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
      image={mockImage}
      //author={mockAuthor}
      date={oldDate}
      peer={mockPeer}
      tags={['Article Tag']}
      route={mockTeaserRoute}
    />
  ))
  .add('Video', () => (
    <DefaultTeaser
      isVideo={true}
      title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
      image={mockImage}
      //author={mockAuthor}
      date={new Date()}
      peer={mockPeer}
      tags={['Article Tag']}
      route={mockTeaserRoute}
    />
  ))
  .add('Lead', () => (
    <DefaultTeaser
      isVideo={true}
      lead={
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.'
      }
      title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
      image={mockImage}
      //author={mockAuthor}
      date={new Date()}
      peer={mockPeer}
      tags={['Article Tag']}
      route={mockTeaserRoute}
    />
  ))
  .add('Grid', () => (
    <GridBlock numColumns={3}>
      <DefaultTeaser
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockImage}
        //author={mockAuthor}
        date={new Date()}
        peer={mockPeer}
        tags={['Article Tag']}
        route={mockTeaserRoute}
      />
      <DefaultTeaser
        isVideo={true}
        preTitle={'Wahlen 2019'}
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockImage}
        //author={mockAuthor}
        date={new Date()}
        tags={['Article Tag']}
        route={mockTeaserRoute}
      />
      <DefaultTeaser
        lead={
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.'
        }
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockImage}
        //author={mockAuthor}
        date={new Date()}
        tags={['Article Tag']}
        route={mockTeaserRoute}
      />
    </GridBlock>
  ))
