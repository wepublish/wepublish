import React from 'react'
import {storiesOf} from '@storybook/react'
import {RelatedArticle} from './relatedArticle'
import {mockPeer, mockTags} from '../.storybook/storiesMockData'
import {GridBlock} from '../blocks/gridBlock'

storiesOf('Molecules|RelatedArticle', module)
  .add('With Image', () => (
    <RelatedArticle
      text="Schwindet das Polareis, droht alles zu kippen"
      image={{url: 'https://dummyimage.com/300x200/000/fff', width: 300, height: 200}}
      peer={mockPeer}
      tags={mockTags}
      showImage
    />
  ))
  .add('Without Image', () => (
    <RelatedArticle
      text="Schwindet das Polareis, droht alles zu kippen"
      image={{url: 'https://dummyimage.com/300x200/000/fff', width: 300, height: 200}}
      peer={mockPeer}
      tags={mockTags}
    />
  ))
  .add('Grid', () => (
    <GridBlock numColumns={3}>
      <RelatedArticle
        text="Schwindet das Polareis, droht alles zu kippen"
        image={{url: 'https://dummyimage.com/300x200/000/fff', width: 300, height: 200}}
        peer={mockPeer}
        tags={mockTags}
        showImage
      />
      <RelatedArticle
        text="Schwindet das Polareis, droht alles zu kippen"
        image={{url: 'https://dummyimage.com/300x200/000/fff', width: 300, height: 200}}
        peer={mockPeer}
        tags={mockTags}
      />
      <RelatedArticle
        text="Schwindet das Polareis, droht alles zu kippen"
        image={{url: 'https://dummyimage.com/900x400/000/fff', width: 300, height: 200}}
        peer={mockPeer}
        tags={mockTags}
        showImage
      />
    </GridBlock>
  ))
