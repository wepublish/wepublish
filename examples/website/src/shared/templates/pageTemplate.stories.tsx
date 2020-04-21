import React from 'react'
import {storiesOf} from '@storybook/react'

import {PageTemplate} from './pageTemplate'
import {
  mockTeaserImage,
  mockAuthor,
  mockNavigationItems,
  mockImage,
  mockPeer
} from '../.storybook/storiesMockData'
import {GridBlock} from '../blocks/gridBlock'
import {DefaultTeaser} from '../teasers/defaultTeaser'
import {ImageTeaser} from '../teasers/imageTeaser'
import {BreakingTeaser} from '../teasers/breakingTeaser'
import {TextTeaser} from '../teasers/textTeaser'
import {BaseTemplate} from './baseTemplate'
import {PageRoute} from '../route/routeContext'

storiesOf('Templates|PageTemplate', module).add('Default', () => (
  <BaseTemplate
    footerText="Footer Text"
    navigationItems={mockNavigationItems}
    footerNavigationItems={mockNavigationItems}
    headerNavigationItems={mockNavigationItems}
    imprintNavigationItems={mockNavigationItems}>
    <PageTemplate title={'Basel'}>
      <GridBlock numColumns={1}>
        <DefaultTeaser
          isSingle={true}
          title="Wahlvorschau: Die Welt ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
          image={mockTeaserImage}
          author={mockAuthor}
          date={new Date()}
          lead={
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.'
          }
          tags={['Article Tag']}
          route={PageRoute.create({})}
        />
      </GridBlock>
      <GridBlock numColumns={6}>
        <DefaultTeaser
          isSingle={false}
          title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
          image={mockImage}
          author={mockAuthor}
          date={new Date()}
          peer={mockPeer}
          tags={['Article Tag']}
          route={PageRoute.create({})}
        />
        <ImageTeaser
          isSingle={false}
          title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
          image={mockImage}
          author={mockAuthor}
          date={new Date()}
          peer={mockPeer}
          tags={['Article Tag']}
          route={PageRoute.create({})}
        />
        <BreakingTeaser
          isSingle={false}
          title="Eplosion in Kabul: Mindestens 14 Tote nach Anschlag"
          date={new Date()}
          route={PageRoute.create({})}
        />
        <ImageTeaser
          isSingle={false}
          title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
          image={mockTeaserImage}
          author={mockAuthor}
          date={new Date()}
          tags={['Article Tag']}
          lead={
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.'
          }
          route={PageRoute.create({})}
        />
        <ImageTeaser
          isSingle={false}
          title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
          image={mockTeaserImage}
          author={mockAuthor}
          date={new Date()}
          peer={mockPeer}
          tags={['Article Tag']}
          route={PageRoute.create({})}
        />
        <DefaultTeaser
          isSingle={false}
          title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
          image={mockImage}
          author={mockAuthor}
          date={new Date()}
          peer={mockPeer}
          tags={['Article Tag']}
          route={PageRoute.create({})}
        />
        <TextTeaser
          isSingle={false}
          title="Wahlvorschau: Die Zentralschweiz ist diesmal nicht nur für Rot-Grün ein hartes Pflaster"
          lead="Am 20. Oktober wählt die Schweiz ein neues Parlament. Wie präsentiert sich die Ausgangslage in den Kantonen?"
          author={mockAuthor}
          date={new Date()}
          tags={['Article Tag']}
          route={PageRoute.create({})}
        />
      </GridBlock>
    </PageTemplate>
  </BaseTemplate>
))
