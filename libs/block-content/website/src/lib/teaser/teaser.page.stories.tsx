import {Meta} from '@storybook/react'
import {pageTeaser} from '@wepublish/testing/fixtures/graphql'
import {Teaser} from './teaser'

export default {
  component: Teaser,
  title: 'Blocks/Teaser/Page'
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
    teaser: pageTeaser
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
    teaser: pageTeaser,
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
      ...pageTeaser,
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
      ...pageTeaser,
      lead: null,
      page: {
        ...pageTeaser.page,
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
      ...pageTeaser,
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
      ...pageTeaser,
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
      ...pageTeaser,
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
      ...pageTeaser,
      image: null,
      Page: {
        ...pageTeaser.page,
        blocks: []
      }
    }
  }
}
