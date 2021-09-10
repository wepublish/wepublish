import {Node} from 'slate'

import {Peer, BlockType, PublishedArticle, EmbedType, TeaserStyle, HeaderType} from '../types'
import {ListicalItem} from '../blocks/listicalBlock'

import {MediaImage, NavigationItem, Author} from '../types'
import {PageRoute, ArticleRoute} from '../route/routeContext'

export const mockTeaserImage: MediaImage = {
  url: 'http://placeimg.com/640/480/tech',
  caption: 'This is the caption for the image.',
  width: 800,
  height: 500
}

export const mockImage: MediaImage = {
  url: 'http://placeimg.com/640/480/nature',
  caption: 'This is the caption for the image.',
  width: 800,
  height: 500
}

export const mockAuthor: Author = {
  name: 'Max Mustermann',
  id: 'max',
  image: {
    url: 'http://placeimg.com/300/200/any',
    caption: 'This is the caption for the image.',
    width: 300,
    height: 200
  }
}

export const mockPeer: Peer = {
  id: 'higgs',
  name: 'Higgs',
  url: 'http://placeimg.com/100/100/any'
}

export const mockAuthors = [mockAuthor]
export const mockTags = ['International', 'Technik']

// TODO: Fix type
export const mockSimpleRichTextValue: any = {
  object: 'document',
  nodes: [
    {
      object: 'block',
      key: '2',
      type: 'paragraph',
      nodes: [
        {
          object: 'text',
          key: '0',
          text:
            "Since it's rich text, you can do things like turn a selection of text Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
        },
        {
          object: 'text',
          key: '1',
          text: 'bold',
          marks: [{type: 'bold'}]
        },
        {
          object: 'text',
          key: '2',
          text: ', or '
        },
        {
          object: 'text',
          key: '3',
          text: 'italic',
          marks: [{type: 'italic'}]
        },
        {
          object: 'text',
          key: '4',
          text: '!'
        }
      ]
    },
    {
      object: 'block',
      key: '3',
      type: 'paragraph',
      nodes: [
        {
          object: 'text',
          key: '0',
          text: 'In addition to block nodes, you can create inline nodes, like '
        },
        {
          object: 'inline',
          key: '1',
          type: 'link',
          data: {
            href: 'https://en.wikipedia.org/wiki/Hypertext'
          },
          nodes: [
            {
              object: 'text',
              key: '0',
              text: 'hyperlinks'
            }
          ]
        },
        {
          object: 'text',
          key: '2',
          text: '!'
        }
      ]
    }
  ]
}

// TODO: Fix type
export const mockRichTextValue: any = {
  object: 'document',
  nodes: [
    {
      object: 'block',
      key: '0',
      type: 'heading-two',
      nodes: [
        {
          object: 'text',
          key: '0',
          text: 'This is a H2 '
        }
      ]
    },
    {
      object: 'block',
      key: '1',
      type: 'heading-three',
      nodes: [
        {
          object: 'text',
          key: '0',
          text: 'This is a H3'
        }
      ]
    },
    {
      object: 'block',
      key: '2',
      type: 'paragraph',
      nodes: [
        {
          object: 'text',
          key: '0',
          text:
            "Since it's rich text, you can do things like turn a selection of text Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
        },
        {
          object: 'text',
          key: '1',
          text: 'bold',
          marks: [{type: 'bold'}]
        },
        {
          object: 'text',
          key: '2',
          text: ', or '
        },
        {
          object: 'text',
          key: '3',
          text: 'italic',
          marks: [{type: 'italic'}]
        },
        {
          object: 'text',
          key: '4',
          text: '!'
        }
      ]
    },
    {
      object: 'block',
      key: '3',
      type: 'paragraph',
      nodes: [
        {
          object: 'text',
          key: '0',
          text: 'In addition to block nodes, you can create inline nodes, like '
        },
        {
          object: 'inline',
          key: '1',
          type: 'link',
          data: {
            href: 'https://en.wikipedia.org/wiki/Hypertext'
          },
          nodes: [
            {
              object: 'text',
              key: '0',
              text: 'hyperlinks'
            }
          ]
        },
        {
          object: 'text',
          key: '2',
          text: '!'
        }
      ]
    },
    {
      object: 'block',
      key: '4',
      type: 'bulleted-list',
      nodes: [
        {
          object: 'block',
          key: '0',
          type: 'list-item',
          nodes: [
            {
              object: 'text',
              key: '0',
              text: 'bullet one'
            }
          ]
        },
        {
          object: 'block',
          key: '1',
          type: 'list-item',
          nodes: [
            {
              object: 'text',
              key: '0',
              text: 'bullet two',
              marks: [{type: 'bold'}, {type: 'italic'}]
            }
          ]
        }
      ]
    },
    {
      object: 'block',
      key: '5',
      type: 'numbered-list',
      nodes: [
        {
          object: 'block',
          key: '0',
          type: 'list-item',
          nodes: [
            {
              object: 'text',
              key: '20',
              text: 'nubmer one'
            }
          ]
        },
        {
          object: 'block',
          key: '1',
          type: 'list-item',
          nodes: [
            {
              object: 'text',
              key: '0',
              text: 'number two',
              marks: [{type: 'italic'}]
            }
          ]
        }
      ]
    }
  ]
}

export const mockNavigationItems: NavigationItem[] = [
  {
    title: 'Basel',
    route: PageRoute.create({}),
    isActive: false
  },
  {
    title: 'Schweiz',
    route: PageRoute.create({}),
    isActive: true
  },
  {
    title: 'International',
    route: PageRoute.create({}),
    isActive: false
  },
  {
    title: 'Sport',
    route: PageRoute.create({}),
    isActive: false
  },
  {
    title: 'Wirtschaft',
    route: PageRoute.create({}),
    isActive: false
  },
  {
    title: 'Kultur',
    route: PageRoute.create({}),
    isActive: false
  }
]

export const mockGalleryMedia = [
  {
    url: 'http://placeimg.com/640/480/nature',
    caption: 'caption 1',
    width: 300,
    height: 200
  },
  {
    url: 'http://placeimg.com/640/480/any',
    caption: 'caption 2',
    width: 300,
    height: 200
  },
  {
    url: 'http://placeimg.com/640/480/people',
    caption: 'caption 3',
    width: 300,
    height: 200
  },
  {
    url: 'http://placeimg.com/640/480/animals',
    caption: 'caption 4',
    width: 300,
    height: 200
  },
  {
    url: 'http://placeimg.com/640/480/tech',
    caption: 'caption 5',
    width: 300,
    height: 200
  },
  {
    url: 'http://placeimg.com/640/480/any',
    caption: 'caption 6',
    width: 300,
    height: 200
  }
]

export const mockArticle: PublishedArticle = {
  id: 'article1',
  publishedAt: new Date(),
  title: 'Wenn das Plareis schmilzt, brauchen wir Eiswürfelmaschinen!',
  lead:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.',
  image: mockTeaserImage,
  slug: 'foo',
  teaserType: TeaserStyle.Default,
  tags: mockTags,
  isBreaking: false,
  blocks: [
    {
      key: '5',
      type: BlockType.Title,
      value: {
        type: HeaderType.Default,
        preTitle: 'Das Ende naht',
        title: 'Wenn das Plareis schmilzt, brauchen wir Eiswürfelmaschinen!',
        lead:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.',
        isHeader: true
      }
    },
    {key: '0', type: BlockType.RichText, value: mockRichTextValue},
    {key: '1', type: BlockType.Gallery, value: {media: mockGalleryMedia, title: 'Test'}},
    {
      key: '2',
      type: BlockType.Image,
      value: {
        url: 'http://placeimg.com/800/500/any',
        width: 300,
        height: 200,
        caption:
          'In Arlesheim muss die Hitze diese Woche besonders gross sein: Die Gemeinde hat nämlich beschlossen'
      }
    },
    {key: '3', type: BlockType.RichText, value: mockRichTextValue},
    {
      key: '4',
      type: BlockType.Embed,
      value: {type: EmbedType.FacebookPost, userID: '20531316728', postID: '10154009990506729'}
    }
  ]
}

export const mockBreakingArticle: PublishedArticle = {
  id: 'article2',
  publishedAt: new Date(),
  title: 'Günther Netzer: Die Homestory!',
  lead:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.',
  image: mockTeaserImage,
  teaserType: TeaserStyle.Breaking,
  slug: 'foo',
  tags: mockTags,
  isBreaking: true,
  blocks: [
    {
      key: '3',
      type: BlockType.Title,
      value: {
        type: HeaderType.Breaking,
        preTitle: 'Grosse Homestory',
        title: 'Günther Netzer: Die Homestory!',
        lead:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.',
        date: new Date(),
        isHeader: true
      }
    },
    {key: '0', type: BlockType.RichText, value: mockRichTextValue},
    {key: '1', type: BlockType.Gallery, value: {media: mockGalleryMedia, title: 'Test'}},
    {key: '2', type: BlockType.RichText, value: mockRichTextValue},
    {
      key: '5',
      type: BlockType.Embed,
      value: {type: EmbedType.InstagramPost, postID: 'B1ZFAoEgtoQ'}
    }
  ]
}

export const mockImageTitleArticle: PublishedArticle = {
  id: 'article3',
  peer: mockPeer,
  publishedAt: new Date(),
  title: 'Schlagerstar Florian Silbereisen gewinnt am Oktoberfest das grosse Plüschtier!',
  lead:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.',
  image: mockTeaserImage,
  teaserType: TeaserStyle.Light,
  slug: 'foo',
  tags: mockTags,
  isBreaking: false,
  blocks: [
    {
      key: '4',
      type: BlockType.TitleImage,
      value: {
        url: 'http://placeimg.com/800/500/any',
        width: 300,
        height: 200
      }
    },
    {
      key: '3',
      type: BlockType.Title,
      value: {
        type: HeaderType.Default,
        title: 'Schlagerstar Florian Silbereisen gewinnt am Oktoberfest das grosse Plüschtier!',
        lead:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur, lorem id aliquet vulputate, elit dolor faucibus velit, vitae bibendum justo quam sit amet lectus.',
        isHeader: true
      }
    },
    {key: '0', type: BlockType.RichText, value: mockRichTextValue},
    {key: '1', type: BlockType.Gallery, value: {media: mockGalleryMedia, title: 'Test'}},
    {key: '2', type: BlockType.RichText, value: mockRichTextValue}
  ]
}

export const mockListical: Array<ListicalItem> = [
  {
    image: mockImage,
    text: mockRichTextValue,
    title: 'Tristique Pharetra Risus Justo Phara Risus Tristique Justo'
  },
  {
    image: mockTeaserImage,
    title: 'Commodo Malesuada Aenean'
  },
  {
    text: mockRichTextValue,
    title: 'Tristique Pharetra Risus Justo'
  },
  {
    image: mockImage,
    text: mockSimpleRichTextValue,
    title: 'Commodo Malesuada Aenean'
  }
]

export const mockTeaserRoute = ArticleRoute.create({id: 'test'})
