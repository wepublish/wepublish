import {Meta} from '@storybook/react'
import {Teaser} from './teaser'
import {articleTeaser} from '@wepublish/testing/fixtures/graphql'

export default {
  component: Teaser,
  title: 'Blocks/Teaser/Article'
} as Meta

export const Default = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: articleTeaser
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
    teaser: articleTeaser,
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
      ...articleTeaser,
      lead: null
    },
    showLead: true
  }
}

export const WithoutLeadWithoutBlock = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...articleTeaser,
      lead: null,
      article: {
        ...articleTeaser.article,
        blocks: []
      }
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
      ...articleTeaser,
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
      ...articleTeaser,
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
      ...articleTeaser,
      image: null
    }
  }
}

export const WithoutImageWithoutBlock = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...articleTeaser,
      image: null,
      article: {
        ...articleTeaser.article,
        blocks: []
      }
    }
  }
}
