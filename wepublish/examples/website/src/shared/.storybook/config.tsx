import React from 'react'

import {action} from '@storybook/addon-actions'
import {configure, addDecorator, addParameters} from '@storybook/react'
import {themes} from '@storybook/theming'

import {withKnobs} from '@storybook/addon-knobs'

import {HelmetProvider} from 'react-helmet-async'
import {StyleProvider} from '@karma.run/react'

import {FacebookProvider} from '../atoms/facebookEmbed'
import {InstagramProvider} from '../atoms/instagramEmbed'
import {TwitterProvider} from '../atoms/twitterEmbed'

import {RouteProvider, PageRoute} from '../route/routeContext'
import {GlobalStyles} from '../style/globalStyles'
import {storybookCreateStyleRenderer} from './styleRenderer'

const req = require.context('../', true, /stories.tsx?$/)
const handleNextRouteAction = action('handleNextRoute', {allowFunction: true})
const styleRenderer = storybookCreateStyleRenderer()

function loadStories() {
  addParameters({options: {theme: themes.normal}})

  addDecorator(withKnobs)
  addDecorator(story => {
    return (
      <HelmetProvider>
        <StyleProvider renderer={styleRenderer}>
          <GlobalStyles />
          <FacebookProvider sdkLanguage={'de_DE'}>
            <InstagramProvider>
              <TwitterProvider>
                <RouteProvider
                  initialRoute={PageRoute.create({})}
                  handleNextRoute={route => {
                    handleNextRouteAction(route)
                    return () => {}
                  }}>
                  {story()}
                </RouteProvider>
              </TwitterProvider>
            </InstagramProvider>
          </FacebookProvider>
        </StyleProvider>
      </HelmetProvider>
    )
  })

  req.keys().forEach(req)
}

configure(loadStories, module)
