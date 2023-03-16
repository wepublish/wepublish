import initStoryShots from '@storybook/addon-storyshots'
import {join, resolve} from 'path'
import {render} from '@testing-library/react'
import {puppeteerTest} from '@storybook/addon-storyshots-puppeteer'

initStoryShots({
  configPath: resolve(__dirname, '../.storybook'),
  integrityOptions: {cwd: join(__dirname, '../..')},
  framework: 'react',
  renderer: render
})

initStoryShots({
  suite: 'Puppeteer storyshots',
  configPath: resolve(__dirname, '../.storybook'),
  integrityOptions: {cwd: join(__dirname, '../..')},
  framework: 'react',
  test: puppeteerTest(),
  renderer: render
})

it('currently storyshots does not work', () => {
  //
})
