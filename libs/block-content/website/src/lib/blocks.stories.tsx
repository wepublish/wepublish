import styled from '@emotion/styled'
import {Meta, StoryFn} from '@storybook/react'
import {
  Block,
  Event,
  EventStatus,
  FullImageFragment,
  FullPollFragment,
  TeaserType
} from '@wepublish/website/api'
import {Blocks} from './blocks'

export default {
  component: Blocks,
  title: 'Blocks/Blocks'
} as Meta

const image = {
  __typename: 'Image',
  id: 'ljh9FHAvHAs0AxC',
  mimeType: 'image/jpg',
  format: 'jpg',
  createdAt: '2023-04-18T12:38:56.369Z',
  modifiedAt: '2023-04-18T12:38:56.371Z',
  filename: 'DSC07717',
  extension: '.JPG',
  width: 4000,
  height: 6000,
  fileSize: 8667448,
  description: null,
  tags: [],
  source: null,
  link: null,
  license: null,
  focalPoint: {
    x: 0.5,
    y: 0.5
  },
  title: null,
  url: 'https://unsplash.it/500/281',
  bigURL: 'https://unsplash.it/800/400',
  largeURL: 'https://unsplash.it/500/300',
  mediumURL: 'https://unsplash.it/300/200',
  smallURL: 'https://unsplash.it/200/100',
  squareBigURL: 'https://unsplash.it/800/800',
  squareLargeURL: 'https://unsplash.it/500/500',
  squareMediumURL: 'https://unsplash.it/300/300',
  squareSmallURL: 'https://unsplash.it/200/200'
} as FullImageFragment

const event = {
  id: '16ca80ce-a2d0-44dc-8c87-b735e4b08877',
  name: 'Cool concert',
  description: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    }
  ],
  status: EventStatus.Scheduled,
  location: 'Basel',
  image,
  tags: [
    {
      id: 'cldwtndha026601nui49kyxrk',
      tag: 'Concert',
      main: false,
      url: '',
      __typename: 'Tag'
    }
  ],
  startsAt: '2023-02-24T09:00:00.000Z',
  endsAt: '2023-02-25T07:30:00.000Z',
  url: 'https://example.com',
  __typename: 'Event'
} as Event

const poll = {
  __typename: 'FullPoll',
  id: '1234',
  question: 'Question',
  infoText: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Normal text,'
        }
      ]
    }
  ],
  externalVoteSources: [
    {
      id: '1234',
      voteAmounts: [
        {
          id: '1',
          __typename: 'PollExternalVote',
          amount: 10,
          answerId: '1234'
        },
        {
          id: '2',
          __typename: 'PollExternalVote',
          amount: 5,
          answerId: '1234-1234'
        }
      ]
    }
  ],
  opensAt: '2023-01-01',
  closedAt: '2033-01-01',
  answers: [
    {
      id: '1234',
      pollId: '1234',
      votes: 1,
      answer: 'Ja'
    },
    {
      id: '1234-1234',
      pollId: '1234',
      votes: 5,
      answer: 'Nein'
    }
  ]
} as FullPollFragment

const blocks = [
  {
    __typename: 'TitleBlock',
    title: 'Title',
    lead: 'Lead'
  },
  {
    __typename: 'RichTextBlock',
    richText: [
      {
        type: 'heading-one',
        children: [
          {
            text: 'Title'
          }
        ]
      },
      {
        type: 'heading-two',
        children: [
          {
            text: 'Title 2'
          }
        ]
      },
      {
        type: 'heading-three',
        children: [
          {
            text: 'Title 3'
          }
        ]
      },
      {
        type: 'unordered-list',
        children: [
          {
            type: 'list-item',
            children: [
              {
                text: 'Unordered List'
              }
            ]
          }
        ]
      },
      {
        type: 'ordered-list',
        children: [
          {
            type: 'list-item',
            children: [
              {
                text: 'Ordered List'
              }
            ]
          }
        ]
      },
      {
        type: 'paragraph',
        children: [
          {
            text: ''
          }
        ]
      },
      {
        type: 'table',
        children: [
          {
            type: 'table-row',
            children: [
              {
                type: 'table-cell',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        text: 'Table Cell 1'
                      }
                    ]
                  }
                ],
                borderColor: '#000000'
              },
              {
                type: 'table-cell',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        text: 'Table Cell 2'
                      }
                    ]
                  }
                ],
                borderColor: '#000000'
              }
            ]
          },
          {
            type: 'table-row',
            children: [
              {
                type: 'table-cell',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        text: 'Table Cell 3'
                      }
                    ]
                  }
                ],
                borderColor: '#000000'
              },
              {
                type: 'table-cell',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        text: 'Table Cell 4'
                      }
                    ]
                  }
                ],
                borderColor: '#000000'
              }
            ]
          }
        ]
      },
      {
        type: 'paragraph',
        children: [
          {
            text: 'Normal text,'
          },
          {
            bold: true,
            text: ' Bold'
          },
          {
            text: ', '
          },
          {
            text: 'Italic',
            italic: true
          },
          {
            text: ', '
          },
          {
            text: 'Underline',
            underline: true
          },
          {
            text: ', '
          },
          {
            text: 'Strikethrough',
            strikethrough: true
          },
          {
            text: ', '
          },
          {
            text: 'Sup',
            superscript: true
          },
          {
            text: ', '
          },
          {
            text: 'Sub',
            subscript: true
          },
          {
            text: ', '
          },
          {
            url: 'https://google.com',
            type: 'link',
            title: 'Link',
            children: [
              {
                text: 'Link'
              }
            ]
          },
          {
            text: ', 😀'
          }
        ]
      }
    ]
  },
  {
    __typename: 'LinkPageBreakBlock',
    text: 'Break block test',
    linkText: null,
    linkURL: null,
    styleOption: 'default',
    richText: [
      {
        type: 'paragraph',
        children: [
          {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
          }
        ]
      },
      {
        type: 'paragraph',
        children: [
          {
            text: ''
          }
        ]
      },
      {
        type: 'heading-three',
        children: [
          {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
          }
        ]
      },
      {
        type: 'heading-three',
        children: [
          {
            text: ''
          }
        ]
      },
      {
        type: 'paragraph',
        children: [
          {
            bold: true,
            text: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
            italic: true
          },
          {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
            italic: true
          },
          {
            text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            italic: true,
            underline: true
          }
        ]
      }
    ],
    linkTarget: null,
    hideButton: false,
    templateOption: 'none',
    layoutOption: 'image-left',
    image
  },
  {
    __typename: 'LinkPageBreakBlock',
    text: 'Break block test',
    linkText: null,
    linkURL: null,
    styleOption: 'default',
    richText: [
      {
        type: 'paragraph',
        children: [
          {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
          }
        ]
      },
      {
        type: 'paragraph',
        children: [
          {
            text: ''
          }
        ]
      },
      {
        type: 'heading-three',
        children: [
          {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
          }
        ]
      },
      {
        type: 'heading-three',
        children: [
          {
            text: ''
          }
        ]
      },
      {
        type: 'paragraph',
        children: [
          {
            bold: true,
            text: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
            italic: true
          },
          {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
            italic: true
          },
          {
            text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            italic: true,
            underline: true
          }
        ]
      }
    ],
    linkTarget: null,
    hideButton: false,
    templateOption: 'none',
    layoutOption: 'image-left',
    image,
    blockStyle: 'ContextBox'
  },
  {
    __typename: 'LinkPageBreakBlock',
    text: 'Break block test',
    linkText: null,
    linkURL: null,
    styleOption: 'default',
    richText: [
      {
        type: 'paragraph',
        children: [
          {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
          }
        ]
      },
      {
        type: 'paragraph',
        children: [
          {
            text: ''
          }
        ]
      },
      {
        type: 'heading-three',
        children: [
          {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
          }
        ]
      },
      {
        type: 'heading-three',
        children: [
          {
            text: ''
          }
        ]
      },
      {
        type: 'paragraph',
        children: [
          {
            bold: true,
            text: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
            italic: true
          },
          {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
            italic: true
          },
          {
            text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            italic: true,
            underline: true
          }
        ]
      }
    ],
    linkTarget: null,
    hideButton: false,
    templateOption: 'none',
    layoutOption: 'image-left',
    image,
    blockStyle: 'Banner'
  },
  {
    __typename: 'ImageBlock',
    caption: 'Caption',
    image
  },
  {
    __typename: 'ImageGalleryBlock',
    images: [
      {
        caption: 'Caption',
        image
      },
      {
        caption: 'Caption',
        image
      },
      {
        caption: 'Caption',
        image
      }
    ]
  },
  {
    __typename: 'ImageGalleryBlock',
    images: [
      {
        caption: 'Caption',
        image
      },
      {
        caption: 'Caption',
        image
      },
      {
        caption: 'Caption',
        image
      }
    ],
    blockStyle: 'Slider'
  },
  {
    __typename: 'ListicleBlock',
    items: [
      {
        title: 'Foobar',
        richText: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Lorem Ipsum'
              }
            ]
          }
        ],
        image
      },
      {
        title: 'Foobar',
        richText: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Lorem Ipsum'
              }
            ]
          }
        ],
        image
      },
      {
        title: 'Foobar',
        richText: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Lorem Ipsum'
              }
            ]
          }
        ],
        image
      }
    ]
  },
  {
    __typename: 'QuoteBlock',
    quote: 'Quote',
    author: 'By an Author'
  },
  {
    __typename: 'EmbedBlock',
    url: 'https://www.example.com',
    title: 'Title',
    width: 560,
    height: 314,
    styleCustom: '',
    sandbox: ''
  },
  {
    __typename: 'BildwurfAdBlock',
    zoneID: '77348'
  },
  {
    __typename: 'FacebookPostBlock',
    userID: 'ladolcekita',
    postID: 'pfbid02JcJeoMg7KasRL8dNjgRJJDFiU8YzeBzEeGeXtqpsE2bnTmeH2y6LRsu7RnmhkPxel'
  },
  {
    __typename: 'FacebookVideoBlock',
    userID: '100064959061177',
    videoID: '1310370486335266'
  },
  {
    __typename: 'InstagramPostBlock',
    postID: 'CvACOxxIqT2'
  },
  {
    __typename: 'PolisConversationBlock',
    conversationID: '744469711'
  },
  {
    __typename: 'SoundCloudTrackBlock',
    trackID: '744469711'
  },
  {
    __typename: 'TikTokVideoBlock',
    userID: 'scout2015',
    videoID: '6718335390845095173'
  },
  {
    __typename: 'TwitterTweetBlock',
    userID: 'WePublish_media',
    tweetID: '1600079498845863937'
  },
  {
    __typename: 'VimeoVideoBlock',
    videoID: '104626862'
  },
  {
    __typename: 'YouTubeVideoBlock',
    videoID: 'CCOdQsZa15o'
  },
  {
    __typename: 'TeaserGridBlock',
    numColumns: 1,
    teasers: [
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'PageTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        page: {
          id: 'cl95fumlq261901phgrctx4mz',
          title: 'Home',
          description: '',
          url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
          blocks: [
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'EventBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'LinkPageBreakBlock'
            },
            {
              __typename: 'TitleBlock',
              title: 'Das ist ein Titel',
              lead: null
            },
            {
              __typename: 'ImageBlock',
              caption: 'Das ist eine Bildunterschrift',
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            }
          ]
        }
      },
      {
        __typename: 'PageTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        page: {
          id: 'cl95fumlq261901phgrctx4mz',
          title: 'Home',
          description: '',
          url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
          blocks: [
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'EventBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'LinkPageBreakBlock'
            },
            {
              __typename: 'TitleBlock',
              title: 'Das ist ein Titel',
              lead: null
            },
            {
              __typename: 'ImageBlock',
              caption: 'Das ist eine Bildunterschrift',
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            }
          ]
        }
      },
      {
        __typename: 'CustomTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        contentUrl: 'https://google.com',
        properties: []
      }
    ]
  },
  {
    __typename: 'TeaserGridBlock',
    numColumns: 3,
    teasers: [
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'PageTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        page: {
          id: 'cl95fumlq261901phgrctx4mz',
          title: 'Home',
          description: '',
          url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
          blocks: [
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'EventBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'LinkPageBreakBlock'
            },
            {
              __typename: 'TitleBlock',
              title: 'Das ist ein Titel',
              lead: null
            },
            {
              __typename: 'ImageBlock',
              caption: 'Das ist eine Bildunterschrift',
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            }
          ]
        }
      },
      {
        __typename: 'PageTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        page: {
          id: 'cl95fumlq261901phgrctx4mz',
          title: 'Home',
          description: '',
          url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
          blocks: [
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'EventBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'LinkPageBreakBlock'
            },
            {
              __typename: 'TitleBlock',
              title: 'Das ist ein Titel',
              lead: null
            },
            {
              __typename: 'ImageBlock',
              caption: 'Das ist eine Bildunterschrift',
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            }
          ]
        }
      },
      {
        __typename: 'CustomTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        contentUrl: 'https://google.com',
        properties: []
      }
    ]
  },
  {
    __typename: 'TeaserGridBlock',
    numColumns: 3,
    teasers: [
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'PageTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        page: {
          id: 'cl95fumlq261901phgrctx4mz',
          title: 'Home',
          description: '',
          url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
          blocks: [
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'EventBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'LinkPageBreakBlock'
            },
            {
              __typename: 'TitleBlock',
              title: 'Das ist ein Titel',
              lead: null
            },
            {
              __typename: 'ImageBlock',
              caption: 'Das ist eine Bildunterschrift',
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            }
          ]
        }
      },
      {
        __typename: 'PageTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        page: {
          id: 'cl95fumlq261901phgrctx4mz',
          title: 'Home',
          description: '',
          url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
          blocks: [
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'EventBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'TeaserGridBlock'
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'LinkPageBreakBlock'
            },
            {
              __typename: 'TitleBlock',
              title: 'Das ist ein Titel',
              lead: null
            },
            {
              __typename: 'ImageBlock',
              caption: 'Das ist eine Bildunterschrift',
              image
            },
            {
              __typename: 'RichTextBlock'
            },
            {
              __typename: 'TeaserGridBlock'
            }
          ]
        }
      },
      {
        __typename: 'CustomTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        contentUrl: 'https://google.com',
        properties: []
      }
    ],
    blockStyle: 'Slider'
  },
  {
    __typename: 'TeaserListBlock',
    filter: {},
    skip: 0,
    take: 6,
    teaserType: TeaserType.Article,
    teasers: [
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      }
    ]
  },
  {
    __typename: 'TeaserListBlock',
    filter: {},
    skip: 0,
    take: 6,
    teaserType: TeaserType.Article,
    teasers: [
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image,
        preTitle: 'Pre Title',
        title: 'Title',
        lead: 'Lead',
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      },
      {
        __typename: 'ArticleTeaser',
        style: 'DEFAULT',
        image: null,
        preTitle: null,
        title: null,
        lead: null,
        article: {
          id: 'clg2cxnig57497901rej8i9ubj1',
          title: 'Chur solidarisiert sich mit der Ukraine',
          preTitle: null,
          lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
          url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
          blocks: [
            {
              __typename: 'TitleBlock',
              title: 'Chur solidarisiert sich mit der Ukraine',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
            },
            {
              __typename: 'ImageBlock',
              caption: null,
              image
            },
            {
              __typename: 'RichTextBlock'
            }
          ],
          authors: [],
          publishedAt: new Date('2023-01-01').toISOString()
        }
      }
    ],
    blockStyle: 'Slider'
  },
  {
    __typename: 'TeaserGridFlexBlock',
    flexTeasers: [
      {
        alignment: {
          x: 0,
          y: 0,
          w: 3,
          h: 6
        },
        teaser: {
          __typename: 'ArticleTeaser',
          style: 'DEFAULT',
          image,
          preTitle: 'Pre Title',
          title: 'Title',
          lead: 'Lead',
          article: {
            id: 'clg2cxnig57497901rej8i9ubj1',
            title: 'Chur solidarisiert sich mit der Ukraine',
            preTitle: null,
            lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
            url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
            blocks: [
              {
                __typename: 'TitleBlock',
                title: 'Chur solidarisiert sich mit der Ukraine',
                lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image
              },
              {
                __typename: 'RichTextBlock'
              }
            ],
            authors: [],
            publishedAt: new Date('2023-01-01').toISOString()
          }
        }
      },
      {
        alignment: {
          x: 3,
          y: 0,
          w: 5,
          h: 3
        },
        teaser: {
          __typename: 'ArticleTeaser',
          style: 'DEFAULT',
          image: null,
          preTitle: null,
          title: null,
          lead: null,
          article: {
            id: 'clg2cxnig57497901rej8i9ubj1',
            title: 'Chur solidarisiert sich mit der Ukraine',
            preTitle: null,
            lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
            url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
            blocks: [
              {
                __typename: 'TitleBlock',
                title: 'Chur solidarisiert sich mit der Ukraine',
                lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image
              },
              {
                __typename: 'RichTextBlock'
              }
            ],
            authors: [],
            publishedAt: new Date('2023-01-01').toISOString()
          }
        }
      },
      {
        alignment: {
          x: 3,
          y: 3,
          w: 5,
          h: 3
        },
        teaser: {
          __typename: 'PageTeaser',
          style: 'DEFAULT',
          image,
          preTitle: 'Pre Title',
          title: 'Title',
          lead: 'Lead',
          page: {
            id: 'cl95fumlq261901phgrctx4mz',
            title: 'Home',
            description: '',
            url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
            blocks: [
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'EventBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'LinkPageBreakBlock'
              },
              {
                __typename: 'TitleBlock',
                title: 'Das ist ein Titel',
                lead: null
              },
              {
                __typename: 'ImageBlock',
                caption: 'Das ist eine Bildunterschrift',
                image
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              }
            ]
          }
        }
      },
      {
        alignment: {
          x: 8,
          y: 0,
          w: 4,
          h: 6
        },
        teaser: {
          __typename: 'PageTeaser',
          style: 'DEFAULT',
          image: null,
          preTitle: null,
          title: null,
          lead: null,
          page: {
            id: 'cl95fumlq261901phgrctx4mz',
            title: 'Home',
            description: '',
            url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
            blocks: [
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'EventBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'LinkPageBreakBlock'
              },
              {
                __typename: 'TitleBlock',
                title: 'Das ist ein Titel',
                lead: null
              },
              {
                __typename: 'ImageBlock',
                caption: 'Das ist eine Bildunterschrift',
                image
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              }
            ]
          }
        }
      },
      {
        alignment: {
          x: 0,
          y: 6,
          w: 12,
          h: 2
        },
        teaser: {
          __typename: 'CustomTeaser',
          style: 'DEFAULT',
          image,
          preTitle: 'Pre Title',
          title: 'Title',
          lead: 'Lead',
          contentUrl: 'https://google.com',
          properties: []
        }
      }
    ]
  },
  {
    __typename: 'HTMLBlock',
    html: '<div>Some HTML embed</div>\n<script>console.log("Some HTML embed")</script>'
  },
  {
    __typename: 'PollBlock',
    poll
  },
  {
    __typename: 'CommentBlock'
  },
  {
    __typename: 'EventBlock',
    events: [event]
  }
] as Block[]

export const Default = {
  args: {
    blocks
  }
}

const Layout = styled.div`
  display: grid;
  gap: 24px;
`

const LayoutTemplate: StoryFn<typeof Blocks> = args => (
  <Layout>
    <Blocks {...args} />
  </Layout>
)

export const WithLayout = {
  render: LayoutTemplate,

  args: {
    blocks
  }
}
