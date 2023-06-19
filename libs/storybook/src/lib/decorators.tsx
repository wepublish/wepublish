import {Global} from '@emotion/react'
import {css} from '@mui/material'
import {Preview} from '@storybook/react'
import {WebsiteBuilderProvider, WebsiteProvider} from '@wepublish/website'
import Head from 'next/head'
import Script from 'next/script'
import {ComponentType} from 'react'

const withWebsiteProvider = (Story: ComponentType) => (
  <WebsiteProvider>
    <WebsiteBuilderProvider Head={Head} Script={Script}>
      <Story />
    </WebsiteBuilderProvider>
  </WebsiteProvider>
)

const extraClassname = css`
  .extra-classname {
    background-color: pink;
  }
`

const withExtraClassname = (Story: ComponentType) => {
  return (
    <>
      <Global styles={extraClassname} />

      <Story />
    </>
  )
}

export const decorators = [withWebsiteProvider, withExtraClassname] as Preview['decorators']
