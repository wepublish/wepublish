import {Meta} from '@storybook/react'
import {image} from '@wepublish/testing/fixtures/graphql'
import {CustomTeaser} from '@wepublish/website/api'
import {Teaser} from './teaser'

export default {
  component: Teaser,
  title: 'Blocks/Teaser/Custom'
} as Meta

const customTeaser = {
  style: 'DEFAULT',
  image,
  preTitle: 'preTitle',
  title: 'Teambesprechung vom 23.05.',
  lead: 'Lead',
  contentUrl: 'https://example.com',
  properties: [],
  __typename: 'CustomTeaser'
} as CustomTeaser

export const Default = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: customTeaser
  }
}

export const WithShowLead = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: customTeaser,
    showLead: true
  }
}

export const WithoutLead = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...customTeaser,
      lead: null
    },
    showLead: true
  }
}

export const WithoutPreTitle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...customTeaser,
      preTitle: null
    }
  }
}

export const WithoutTitle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...customTeaser,
      title: null
    }
  }
}

export const WithoutImage = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...customTeaser,
      image: null
    }
  }
}
