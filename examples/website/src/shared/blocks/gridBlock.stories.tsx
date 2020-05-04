import React from 'react'
import {storiesOf} from '@storybook/react'
import {GridBlock} from './gridBlock'

import {DefaultTeaser} from '../teasers/defaultTeaser'
import {ImageTeaser} from '../teasers/imageTeaser'
import {BreakingTeaser} from '../teasers/breakingTeaser'
import {TextTeaser} from '../teasers/textTeaser'
import {mockTeaserImage, mockAuthor} from '../.storybook/storiesMockData'
import {PageRoute} from '../route/routeContext'

storiesOf('Blocks|GridBlock', module)
  .add('1 Column', () => (
    <GridBlock numColumns={1}>
      <DefaultTeaser
        isSingle={true}
        title="Wahlvorschau: Die Welt ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <DefaultTeaser
        isSingle={true}
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <ImageTeaser
        isSingle={true}
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <BreakingTeaser
        isSingle={true}
        title="Eplosion in Kabul: Mindestens 14 Tote nach Anschlag"
        date={new Date()}
        route={PageRoute.create({})}
      />
      <ImageTeaser
        isSingle={true}
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <ImageTeaser
        isSingle={true}
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <DefaultTeaser
        isSingle={true}
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <TextTeaser
        isSingle={true}
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        lead="Am 20. Oktober wählt die Schweiz ein neues Parlament. Wie präsentiert sich die Ausgangslage in den Kantonen?"
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
    </GridBlock>
  ))
  .add('3 Columns', () => (
    <GridBlock numColumns={6}>
      <DefaultTeaser
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <DefaultTeaser
        isVideo={true}
        title="Die Welt geht unter!"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <ImageTeaser
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <BreakingTeaser
        title="Explosion in Kabul: Mindestens 14 Tote nach Anschlag"
        date={new Date()}
        route={PageRoute.create({})}
      />
      <ImageTeaser
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
      <ImageTeaser
        title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
        image={mockTeaserImage}
        author={mockAuthor}
        date={new Date()}
        peer={{id: 'wepublish', name: 'Wepublish', url: 'https://wepublish.ch'}}
        tags={['Article Tag']}
        route={PageRoute.create({})}
      />
    </GridBlock>
  ))
